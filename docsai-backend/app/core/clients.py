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

load_dotenv()

qdrant: QdrantClient = None
sparse_model: SparseTextEmbedding = None
chat_checkpointer: AsyncPostgresSaver = None
chat_graph:CompiledStateGraph = None


def init_sparse_model():
    global sparse_model
    sparse_model = SparseTextEmbedding(model_name="prithvida/Splade_PP_en_v1")


def init_qdrant():
    global qdrant
    qdrant = QdrantClient(url="http://localhost:6333")
    existing = [c.name for c in qdrant.get_collections().collections]
    if "legal_docs" not in existing:
        qdrant.create_collection(
            collection_name="legal_docs",
            vectors_config={"dense": VectorParams(size=1536, distance=Distance.COSINE)},
            sparse_vectors_config={"sparse": SparseVectorParams(index=SparseIndexParams(on_disk=False))}
        )


def init_cloudinary():
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    )


async def init_checkpointer():
    global chat_checkpointer

    pg_url = os.getenv("DATABASE_URL").replace(
        "postgresql+asyncpg://", "postgresql://"
    )

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
    chat_checkpointer = AsyncPostgresSaver(conn_chat)
    await chat_checkpointer.setup()