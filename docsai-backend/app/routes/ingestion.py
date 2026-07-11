from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import StreamingResponse
from app.core import clients
import json
from langchain_core.runnables import RunnableConfig
from typing import AsyncGenerator

router = APIRouter(prefix='/v1')

MAX_FILE_SIZE = 10 * 1024 * 1024


async def ingestion_stream(
    thread_id: str, 
    raw_bytes: bytes, 
    filename: str, 
    user_id: str, 
    username: str
) -> AsyncGenerator[str, None]:
    """Stream ingestion events back to client."""
    config: RunnableConfig = {
        "metadata": {
            "thread_id": thread_id,
            "user_id": user_id,
            "username": username,
            "filename": filename,
        },
        "tags": ["production", "docsai"],
        "run_name": "DocsAI Ingestion Run",
    }
    
    try:
        # Get the initialized ingestion graph
        graph = clients.get_ingestion_graph()
        
        # Build input matching GraphState exactly
        graph_input = {
            "bytes": raw_bytes,
            "thread_id": thread_id,
            "user_id": user_id,
            "metadata": {
                "filename": filename,
                "username": username,
            },
        }
        
        async for event in graph.astream_events(
            graph_input,
            version="v2",
            config=config
        ):
            kind = event["event"]
            name = event.get("name", "")

            # Node started events
            if kind == "on_chain_start" and name in [
                "LLM_check_node", 
                "chunking_node", 
                "embedding_and_inserting_node", 
                "rejection_node"
            ]:
                messages = {
                    "LLM_check_node": "Analyzing your document...",
                    "chunking_node": "Processing and chunking your file...",
                    "embedding_and_inserting_node": "Embedding and storing chunks...",
                    "rejection_node": "Document validation failed...",
                }
                yield f"data: {json.dumps({'type': 'status', 'node': name, 'message': messages.get(name, '')})}\n\n"

            # Node finished events
            elif kind == "on_chain_end":
                data = event.get("data", {})
                output = data.get("output")
                
                if not output:
                    continue

                # LLM Check Node - has llm_result
                if name == "LLM_check_node" and output.get("llm_result"):
                    llm_result = output["llm_result"]
                    yield f"data: {json.dumps({\
                        'type': 'llm_check', \
                        'verdict': llm_result.verdict, \
                        'document_type': llm_result.document_type, \
                        'confidence': llm_result.confidence, \
                        'detected_keywords': llm_result.detected_keywords\
                    })}\n\n"

                # Chunking Node - has chunks
                elif name == "chunking_node" and output.get("chunks"):
                    chunks = output["chunks"]
                    chunk_count = len(chunks)
                    yield f"data: {json.dumps({\
                        'type': 'status', \
                        'node': name, \
                        'message': f'✅ Created {chunk_count} chunks'\
                    })}\n\n"

                # Embedding & Inserting Node - has ingestion info
                elif name == "embedding_and_inserting_node" and output.get("ingestion"):
                    ingestion = output["ingestion"]
                    yield f"data: {json.dumps({\
                        'type': 'done', \
                        'message': 'Document ingested successfully!', \
                        'total_chunks': ingestion.total_chunks, \
                        'collection_name': ingestion.collection_name, \
                        'inserted_at': str(ingestion.inserted_at)\
                    })}\n\n"

            # Rejection path
            elif kind == "on_chain_end" and name == "rejection_node":
                data = event.get("data", {})
                output = data.get("output")
                
                if output and output.get("rejection"):
                    rejection = output["rejection"]
                    yield f"data: {json.dumps({\
                        'type': 'rejected', \
                        'message': 'Document rejected — not a legal/compliance document.', \
                        'reason': rejection.reason, \
                        'document_type': rejection.document_type, \
                        'confidence': rejection.confidence\
                    })}\n\n"

        yield "data: [DONE]\n\n"

    except Exception as e:
        import traceback
        print(f"Ingestion error: {e}")
        traceback.print_exc()
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"


@router.post("/ingest-docs")
async def ingestion_pipeline(
    request: Request,
    thread_id: str = Form(...),
    file: UploadFile = File(...)
):
    """Ingest a PDF document and stream back processing events."""
    # Validate file type
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400, 
            detail="Invalid file type. Only PDFs are allowed."
        )

    # Read file
    raw_bytes = await file.read()

    # Validate file size
    if len(raw_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400, 
            detail=f"File too large. Max size: {MAX_FILE_SIZE // (1024 * 1024)} MB"
        )

    # Get user info from middleware
    user_id = request.state.user_id
    username = request.state.username
    filename = file.filename or "document.pdf"

    # Stream ingestion events
    return StreamingResponse(
        ingestion_stream(thread_id, raw_bytes, filename, user_id, username),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )