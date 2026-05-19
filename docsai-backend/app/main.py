# main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.core.clients import init_qdrant, init_sparse_model, init_cloudinary, init_checkpointer
from app.core.auth_middleware import AuthMiddleware
from app.routes.auth import router as AuthRouter
from app.routes.ingestion import router as IngestRouter
from app.routes.generation import router as GenerationRouter
from app.routes.user import router as UserRouter
from app.core import clients
from app.services.chat.graph import build_chat_graph


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ DB tables ready")

    init_sparse_model()
    print("✅ Sparse model ready")

    init_qdrant()
    print("✅ Qdrant connected")

    init_cloudinary()
    print("✅ Cloudinary ready")

    await init_checkpointer()
    print("✅ Checkpointer ready")

    clients.chat_graph = build_chat_graph(clients.chat_checkpointer)
    print("✅ Chat graph ready")

    yield
    
    await clients.chat_checkpointer.conn.close()


app = FastAPI(lifespan=lifespan)

app.include_router(AuthRouter, prefix="/api")
app.include_router(IngestRouter, prefix="/api")
app.include_router(GenerationRouter, prefix="/api")
app.include_router(UserRouter, prefix="/api")

app.add_middleware(AuthMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)