from fastapi import APIRouter, Request, HTTPException
from sqlalchemy import select
from app.core.database import SessionLocal
from app.models.document import Document
from app.core import clients
import json

router = APIRouter(prefix='/v1')


@router.get("/documents")
async def get_documents(request: Request, thread_id: str):
    user_id = request.state.user_id

    async with SessionLocal() as db:
        result = await db.execute(
            select(Document).where(
                Document.thread_id == thread_id,
                Document.user_id == user_id
            )
        )
        doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="No document found for this thread.")

    return {
        "thread_id": doc.thread_id,
        "filename": doc.filename,
        "cloudinary_url": doc.cloudinary_url,
        "document_type": doc.document_type,
        "confidence": doc.confidence,
        "total_chunks": doc.total_chunks,
        "uploaded_at": doc.uploaded_at.isoformat(),
    }


@router.get("/threads")
async def get_threads(request: Request):
    user_id = request.state.user_id

    async with SessionLocal() as db:
        result = await db.execute(
            select(Document).where(Document.user_id == user_id)
        )
        docs = result.scalars().all()
    print("ALl Threads of user : " , docs)
    if not docs:
        return {"threads": []}

    return {
        "threads": [
            {
                "thread_id": doc.thread_id,
                "filename": doc.filename,
                "cloudinary_url": doc.cloudinary_url,
                "document_type": doc.document_type,
                "confidence": doc.confidence,
                "total_chunks": doc.total_chunks,
                "uploaded_at": doc.uploaded_at.isoformat(),
            }
            for doc in docs
        ]
    }