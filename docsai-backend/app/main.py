from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.core.clients import (
    init_qdrant,
    init_sparse_model,
    init_cloudinary,
    init_checkpointer,
)
from app.core.auth_middleware import AuthMiddleware
from app.routes.auth import router as AuthRouter
from app.routes.ingestion import router as IngestRouter
from app.routes.generation import router as GenerationRouter
from app.routes.user import router as UserRouter
from app.core import clients
from app.services.chat.graph import build_chat_graph
from app.services.ingestion.graph import build_ingestion_graph


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize all clients and resources on startup."""
    try:
        # Database
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("✅ DB tables ready")

        # AI/ML clients
        init_sparse_model()
        print("✅ Sparse model ready")

        init_qdrant()
        print("✅ Qdrant connected")

        init_cloudinary()
        print("✅ Cloudinary ready")

        await init_checkpointer()
        print("✅ Checkpointer ready")

        # Build ingestion graph with checkpointer
        if clients.chat_checkpointer is None:
            raise RuntimeError("Checkpointer not initialized")
        
        ingestion_graph = build_ingestion_graph(clients.chat_checkpointer)
        clients.ingestion_graph = ingestion_graph
        print("✅ Ingestion graph ready")

        # Build chat graph with checkpointer
        chat_graph = build_chat_graph(clients.chat_checkpointer)
        clients.chat_graph = chat_graph
        print("✅ Chat graph ready")

        yield

    except Exception as e:
        print(f"❌ Startup error: {e}")
        raise

    finally:
        # Shutdown - close database connection
        if clients.chat_checkpointer is not None:
            try:
                await clients.chat_checkpointer.conn.close()
                print("✅ Checkpointer connection closed")
            except Exception as e:
                print(f"⚠️ Error closing checkpointer: {e}")

        # Close engine
        try:
            await engine.dispose()
            print("✅ Engine disposed")
        except Exception as e:
            print(f"⚠️ Error disposing engine: {e}")


app = FastAPI(
    title="DocsAI API",
    lifespan=lifespan,
)

# Include routers
app.include_router(AuthRouter, prefix="/api")
app.include_router(IngestRouter, prefix="/api")
app.include_router(GenerationRouter, prefix="/api")
app.include_router(UserRouter, prefix="/api")

# Add middleware (order matters - CORS should be last/outermost)
app.add_middleware(AuthMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)