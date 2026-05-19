# nodes.py
from .model import GraphState , LegalCheckResult , RejectionInfo , IngestionInfo
from .prompts import legal_check_prompt
import pdfplumber
import io
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document as  LCDocument
from langchain_qdrant import QdrantVectorStore, FastEmbedSparse, RetrievalMode
from langchain_openai import OpenAIEmbeddings
from app.core.clients import qdrant
from qdrant_client.models import PointStruct, SparseVector
from app.core import clients
import cloudinary.uploader
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import SessionLocal
from app.models.document import Document as DBDocument
import uuid
import asyncio
from .prompts import citation_extraction_prompt
from .model import ChunkCitation
load_dotenv()

PREVIEW_PAGES = 5

async def LLM_check_node(state: GraphState):
    pdf_bytes = state.bytes

    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        pages = [
            {"page": i + 1, "text": page.extract_text() or ""}
            for i, page in enumerate(pdf.pages)
        ]
    # Take first 5 pages only
    preview_pages = pages[:PREVIEW_PAGES]
    content = "\n\n".join(
        f"[Page {p['page']}]\n{p['text']}" for p in preview_pages
    )

    model = ChatOpenAI(model="gpt-4o-mini", temperature=0).with_structured_output(LegalCheckResult)

    chain = legal_check_prompt | model

    result: LegalCheckResult = await chain.ainvoke({
        "page_count": len(preview_pages),
        "filename": state.metadata.get("filename", "unknown"),
        "content": content
    })
    
    return {
        "llm_result": result
    }
    
async def rejection_node(state: GraphState):
    result = state.llm_result
    return {
        "rejection": RejectionInfo(
            reason=result.reason,
            document_type=result.document_type,
            confidence=result.confidence,
        )
    }    
    

async def chunking_node(state: GraphState):
    pdf_bytes = state.bytes
    filename = state.metadata.get("filename", "unknown")

    # 1. Extract pages with full word-level positioning
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        total_pages = len(pdf.pages)
        pages = []
        for i, page in enumerate(pdf.pages):
            words = page.extract_words()  # word-level bbox
            text = page.extract_text() or ""

            # Compute page-level bounding box of all text
            if words:
                x0 = min(w["x0"] for w in words)
                y0 = min(w["top"] for w in words)
                x1 = max(w["x1"] for w in words)
                y1 = max(w["bottom"] for w in words)
                bbox = [x0, y0, x1, y1]
            else:
                bbox = []

            pages.append({
                "page": i + 1,
                "text": text,
                "bbox": bbox,
                "page_width": page.width,
                "page_height": page.height,
                "word_count": len(words),
            })

    # 2. Chunk and wrap in LangChain Document
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1024,
        chunk_overlap=160,
        separators=["\n\n", "\n", ".", " ", ""]
    )

    documents: list[LCDocument] = []
    for page in pages:
        if not page["text"].strip():
            continue

        splits = splitter.split_text(page["text"])
        total_chunks_on_page = len(splits)

        for i, split in enumerate(splits):
            # Estimate vertical position of chunk within the page
            chunk_ratio_start = i / total_chunks_on_page
            chunk_ratio_end = (i + 1) / total_chunks_on_page
            estimated_y0 = round(page["page_height"] * chunk_ratio_start, 2)
            estimated_y1 = round(page["page_height"] * chunk_ratio_end, 2)

            doc = LCDocument(
                page_content=split,
                metadata={
                    # ── Document level ────────────────────
                    "document": filename,
                    "thread_id": state.thread_id,
                    "total_pages": total_pages,

                    # ── Page level ────────────────────────
                    "page": page["page"],
                    "page_width": page["page_width"],
                    "page_height": page["page_height"],
                    "page_word_count": page["word_count"],
                    "page_bbox": page["bbox"],

                    # ── Chunk level ───────────────────────
                    "chunk_index": i,
                    "total_chunks_on_page": total_chunks_on_page,
                    "chunk_char_count": len(split),

                    # ── Positional estimate within page ───
                    "estimated_y0": estimated_y0,
                    "estimated_y1": estimated_y1,
                    "position_label": _position_label(chunk_ratio_start),
                }
            )
            documents.append(doc)
    return {"chunks": documents}

async def _extract_citation(model, doc: LCDocument) -> LCDocument:
    chain = citation_extraction_prompt | model
    result: ChunkCitation = await chain.ainvoke({"chunk_text": doc.page_content})
    
    doc.metadata.update({
        "clause_refs": result.clause_refs,
        "parties": result.parties,
        "dates": result.dates,
        "legal_refs": result.legal_refs,
        "key_obligations": result.key_obligations,
        "citation_label": result.citation_label,
    })
    return doc

async def citation_extraction_node(state: GraphState):
    model = ChatOpenAI(model="gpt-4o-mini", temperature=0).with_structured_output(ChunkCitation)
    
    tasks = [_extract_citation(model, doc) for doc in state.chunks]
    enriched_chunks = await asyncio.gather(*tasks)
    
    return {"chunks": list(enriched_chunks)}

async def embedding_and_inserting_node(state: GraphState):
    chunks = state.chunks
    texts = [doc.page_content for doc in chunks]

    # Dense
    dense_model = OpenAIEmbeddings(model="text-embedding-3-small")
    dense_vectors = await dense_model.aembed_documents(texts)

    # Sparse — reuse already loaded model from lifespan
    sparse_embeddings = list(clients.sparse_model.embed(texts))

    points = []
    for doc, dense, sparse in zip(chunks, dense_vectors, sparse_embeddings):
        points.append(PointStruct(
            id=str(uuid.uuid4()),
            vector={
                "dense": dense,
                "sparse": SparseVector(
                    indices=sparse.indices.tolist(),
                    values=sparse.values.tolist(),
                )
            },
            payload={**doc.metadata, "text": doc.page_content}
        ))

    clients.qdrant.upsert(collection_name="legal_docs", points=points)

    return {
        "ingestion": IngestionInfo(
            total_chunks=len(chunks),
            collection_name="legal_docs",
            embeddings_stored=True,
        )
    }


async def save_to_cloudinary_and_db_node(state: GraphState):
    filename = state.metadata.get("filename", "document.pdf")

    # 1. Upload to Cloudinary
    result = cloudinary.uploader.upload(
        io.BytesIO(state.bytes),
        resource_type="raw",
        folder="docsai/documents",
        public_id=f"{state.thread_id}_{filename}",
        overwrite=True,
    )
    cloudinary_url = result["secure_url"]

    # 2. Save to PostgreSQL
    async with SessionLocal() as db:
        doc = DBDocument(
            thread_id=state.thread_id,
            user_id=uuid.UUID(state.user_id),
            filename=filename,
            cloudinary_url=cloudinary_url,
            document_type=state.llm_result.document_type if state.llm_result else None,
            confidence=state.llm_result.confidence if state.llm_result else None,
            total_chunks=state.ingestion.total_chunks if state.ingestion else None,
        )
        db.add(doc)
        await db.commit()

    return {"cloudinary_url": cloudinary_url}


def _position_label(ratio: float) -> str:
    """Human-readable vertical position for citations."""
    if ratio < 0.33:
        return "top"
    elif ratio < 0.66:
        return "middle"
    return "bottom"


# Conditional edge — return node name as string
def route_to_rejection_or_chunking(state: GraphState) -> str:
    if state.llm_result and state.llm_result.verdict == "approved":
        return "chunking_node"
    return "rejection_node"