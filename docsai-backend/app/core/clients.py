# clients.py
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, SparseVectorParams, Distance, SparseIndexParams
from fastembed import SparseTextEmbedding
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
import os
import psycopg
from langgraph.graph.state import CompiledStateGraph
from typing import Optional, Union
from typing import cast
from psycopg.rows import DictRow
load_dotenv()

qdrant: Optional[QdrantClient] = None
sparse_model: Optional[SparseTextEmbedding] = None
chat_checkpointer: Optional[AsyncPostgresSaver] = None
chat_graph: Optional[CompiledStateGraph] = None
ingestion_graph: Optional[CompiledStateGraph] = None
 
 
def get_ingestion_graph() -> CompiledStateGraph:
    """Get the initialized ingestion graph. Raises if not initialized."""
    if ingestion_graph is None:
        raise RuntimeError(
            "Ingestion graph not initialized. Call build_ingestion_graph() on app startup."
        )
    return ingestion_graph


def init_sparse_model():
    global sparse_model
    try:
        sparse_model = SparseTextEmbedding(
            model_name="prithvida/Splade_PP_en_v1")
    except Exception as e:
        print(f"Error initializing sparse model: {e}")
        raise


def init_qdrant():
    global qdrant
    try:
        qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
        if not qdrant_url:
            raise ValueError("QDRANT_URL environment variable not set")

        qdrant = QdrantClient(url=qdrant_url)

        # Check if we can connect to Qdrant
        qdrant.get_collections()

        existing = [c.name for c in qdrant.get_collections().collections]
        if "legal_docs" not in existing:
            qdrant.create_collection(
                collection_name="legal_docs",
                vectors_config={"dense": VectorParams(
                    size=1536, distance=Distance.COSINE)},
                sparse_vectors_config={"sparse": SparseVectorParams(
                    index=SparseIndexParams(on_disk=False))}
            )
    except Exception as e:
        print(f"Error initializing Qdrant: {e}")
        raise


def init_cloudinary():
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")

    if not all([cloud_name, api_key, api_secret]):
        raise ValueError("Cloudinary environment variables not set")

    try:
        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret,
        )
    except Exception as e:
        print(f"Error initializing Cloudinary: {e}")
        raise


async def init_checkpointer():
    global chat_checkpointer
    try:
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise ValueError("DATABASE_URL environment variable not set")

        # Handle different URL schemes
        if database_url.startswith("postgresql+asyncpg://"):
            pg_url = database_url.replace(
                "postgresql+asyncpg://", "postgresql://")
        else:
            pg_url = database_url

        # Create schema on a temporary connection
        setup_conn = await psycopg.AsyncConnection.connect(pg_url, autocommit=True)
        async with setup_conn.cursor() as cur:
            await cur.execute("CREATE SCHEMA IF NOT EXISTS chat_schema;")
        await setup_conn.close()

        # Long-lived connection for the checkpointer
        conn_chat = await psycopg.AsyncConnection.connect(
            pg_url + "?options=-c%20search_path%3Dchat_schema",
            autocommit=True,
        )
        chat_checkpointer = AsyncPostgresSaver(
            conn=cast(psycopg.AsyncConnection[DictRow], conn_chat)
        )
        await chat_checkpointer.setup()
    except Exception as e:
        print(f"Error initializing checkpointer: {e}")
        raise
    
    
async def init_chat_graph(graph: CompiledStateGraph):
    """Initialize the chat graph. Call this on app startup."""
    global chat_graph
    chat_graph = graph
    print("Chat graph initialized")


def get_chat_graph() -> CompiledStateGraph:
    """Get the initialized chat graph. Raises if not initialized."""
    if chat_graph is None:
        raise RuntimeError(
            "Chat graph not initialized. Call init_chat_graph() on app startup."
        )
    return chat_graph
