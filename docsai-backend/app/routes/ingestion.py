from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import StreamingResponse
from app.services.ingestion.graph import graph
import json

router = APIRouter(prefix='/v1')

MAX_FILE_SIZE = 10 * 1024 * 1024

async def ingestion_stream(thread_id: str, raw_bytes: bytes, filename: str, user_id: str):
    async for event in graph.astream_events(
        {
            "bytes": raw_bytes,
            "thread_id": thread_id,
            "user_id": user_id,          # ← inside the input dict
            "metadata": {"filename": filename}
        },
        version="v2"
    ):
        kind = event["event"]
        name = event.get("name", "")

        # Node started events
        if kind == "on_chain_start" and name in ["LLM_check_node", "chunking_node", "embedding_and_inserting_node", "rejection_node"]:
            messages = {
                "LLM_check_node": "Analyzing your document...",
                "chunking_node": "Processing and chunking your file...",
                "embedding_and_inserting_node": "Embedding and storing chunks...",
                "rejection_node": "Document validation failed...",
            }
            yield f"data: {json.dumps({'type': 'status', 'node': name, 'message': messages.get(name, '')})}\n\n"

        # Node finished events
        elif kind == "on_chain_end" and name in ["LLM_check_node", "chunking_node", "embedding_and_inserting_node"]:
            output = event.get("data", {}).get("output", {})

            if name == "LLM_check_node" and output.get("llm_result"):
                llm = output["llm_result"]
                yield f"data: {json.dumps({'type': 'llm_check', 'verdict': llm.verdict, 'document_type': llm.document_type, 'confidence': llm.confidence, 'detected_keywords': llm.detected_keywords})}\n\n"

            elif name == "chunking_node" and output.get("chunks"):
                chunk_count = len(output["chunks"])
                yield f"data: {json.dumps({'type': 'status', 'node': name, 'message': f'✅ Created {chunk_count} chunks'})}\n\n"
            elif name == "embedding_and_inserting_node" and output.get("ingestion"):
                ingestion = output["ingestion"]
                yield f"data: {json.dumps({'type': 'done', 'message': 'Document ingested successfully!', 'total_chunks': ingestion.total_chunks, 'collection_name': ingestion.collection_name, 'inserted_at': ingestion.inserted_at})}\n\n"

        # Rejection
        if name == "rejection_node" and output.get("rejection"):
            r = output["rejection"]
            yield f"data: {json.dumps({'type': 'rejected', 'message': 'Document rejected — not a legal/compliance document.', 'reason': r.reason, 'document_type': r.document_type, 'confidence': r.confidence})}\n\n"

    yield "data: [DONE]\n\n"


@router.post("/ingest-docs")
async def ingestion_pipeline(
    request: Request,
    thread_id: str = Form(...),
    file: UploadFile = File(...)
):
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400, detail="Invalid file type. Only PDFs are allowed.")

    raw_bytes = await file.read()
    user_id = request.state.user_id

    if len(raw_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400, detail=f"File too large. Max size: {MAX_FILE_SIZE // (1024 * 1024)} MB")

    return StreamingResponse(
        ingestion_stream(thread_id, raw_bytes, file.filename, user_id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )
