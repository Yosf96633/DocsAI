# model.py
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime
from langchain_core.documents import Document

class LegalCheckResult(BaseModel):
    verdict: Literal["approved", "rejected"] = Field(...)
    reason: str = Field(...)
    document_type: str = Field(...)
    confidence: Literal["high", "medium", "low"] = Field(...)
    detected_keywords: List[str] = Field(...)

class RejectionInfo(BaseModel):
    reason: str
    document_type: str
    confidence: Literal["high", "medium", "low"]
    rejected_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class IngestionInfo(BaseModel):
    total_chunks: int
    collection_name: str
    embeddings_stored: bool
    inserted_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class ChunkCitation(BaseModel):
    clause_refs: List[str] = Field(default_factory=list, description="Clause or section references e.g. Section 4.2, Article III")
    parties: List[str] = Field(default_factory=list, description="Party names mentioned in this chunk")
    dates: List[str] = Field(default_factory=list, description="Dates or effective dates mentioned")
    legal_refs: List[str] = Field(default_factory=list, description="Statutes, exhibits, defined terms referenced")
    key_obligations: List[str] = Field(default_factory=list, description="Short obligations or duties stated in this chunk")
    citation_label: str = Field(default="", description="One-liner summary e.g. Section 4.2 — Termination clause")

class GraphState(BaseModel):
    # Input
    bytes: bytes
    thread_id: str
    user_id: str          # 👈 added
    metadata: Optional[dict] = {}

    # LLM verdict
    llm_result: Optional[LegalCheckResult] = None

    # Rejection path
    rejection: Optional[RejectionInfo] = None

    # Happy path
    chunks: Optional[list] = None
    ingestion: Optional[IngestionInfo] = None
    cloudinary_url: Optional[str] = None   # 👈 added