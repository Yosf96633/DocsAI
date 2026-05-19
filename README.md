# 📚 DocsAI

> **AI-powered legal document analysis & chat — built for legal professionals.**

DocsAI is a full-stack RAG (Retrieval-Augmented Generation) application that lets users upload legal PDFs and chat with them using natural language. Every answer is grounded in the source document, with **precise citations** (document, page, position, and clause references) so legal professionals can trust and verify every response.

---

## ✨ Features

- 🔐 **Secure authentication** — JWT + HTTP-only cookies, bcrypt-hashed passwords
- 📄 **Smart document ingestion** — Validates that uploads are genuine legal documents before processing
- 🧠 **Hybrid retrieval** — Dense (OpenAI embeddings) + sparse (SPLADE) search via Qdrant, reranked by Cohere
- 🪶 **Streaming chat** — Token-by-token responses powered by Groq (Llama 3.3 70B) over Server-Sent Events
- 📌 **Strict, verifiable citations** — Every answer references the exact document, page, position, and clause
- 💬 **Persistent threads** — Conversation history saved per document via LangGraph + Postgres checkpointing
- ☁️ **Cloud storage** — Original PDFs preserved on Cloudinary
- 🎨 **Modern UI** — Next.js 16 + React 19, Tailwind v4, Radix UI primitives, Framer Motion, Zustand

---

## 🏗️ Architecture

```
┌────────────────────┐         ┌──────────────────────────────────────┐
│  Next.js Frontend  │ ───────▶│           FastAPI Backend            │
│   (port 3000)      │  HTTP   │             (port 8000)              │
└────────────────────┘  + SSE  └──────────────────────────────────────┘
                                              │
                  ┌───────────────────────────┼───────────────────────────┐
                  ▼                           ▼                           ▼
          ┌──────────────┐           ┌─────────────────┐         ┌────────────────┐
          │  PostgreSQL  │           │     Qdrant      │         │   Cloudinary   │
          │ users / docs │           │ vector storage  │         │   PDF assets   │
          │ chat history │           │ (hybrid search) │         │                │
          └──────────────┘           └─────────────────┘         └────────────────┘
                                              │
                  ┌───────────────────────────┼───────────────────────────┐
                  ▼                           ▼                           ▼
            OpenAI (embeddings)        Cohere (reranker)            Groq (LLM)
```

### LangGraph Pipelines

**Ingestion graph** (`app/services/ingestion/graph.py`):

```
LLM legal-check ──▶ chunking ──▶ citation extraction ──▶ embedding & Qdrant upsert ──▶ Cloudinary + Postgres
        │
        └─▶ rejection (non-legal documents)
```

**Chat graph** (`app/services/chat/graph.py`):

```
retrieval (hybrid + rerank) ──▶ generation (Groq Llama 3.3 70B, streamed)
```

---

## 📁 Project Structure

```
DocsAI/
├── docsai-backend/                  # FastAPI + LangGraph + Qdrant + Postgres
│   ├── app/
│   │   ├── core/                    # clients, db, security, auth middleware
│   │   ├── models/                  # SQLAlchemy models (User, Document)
│   │   ├── routes/                  # auth, ingestion, generation, user
│   │   ├── services/
│   │   │   ├── chat/                # retrieval + generation graph
│   │   │   └── ingestion/           # legal-check, chunk, embed, store graph
│   │   └── main.py
│   ├── docker-compose.yml           # Qdrant + Postgres + pgAdmin
│   └── pyproject.toml
│
└── docsai_frontend/                 # Next.js 16 + React 19 + Tailwind v4
    └── src/
        ├── app/
        │   ├── (auth)/              # login, register
        │   ├── (protected)/chat/    # main chat workspace
        │   └── page.tsx             # landing
        ├── components/
        │   ├── chat/                # ChatWindow, Sidebar, UploadPanel, MessageBubble
        │   ├── landing/             # Hero, Features, Footer, Navbar
        │   └── ui/                  # Radix-based primitives
        ├── lib/api.ts               # fetch + SSE helpers
        └── store/                   # Zustand stores (auth, chat)
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.12+** and [`uv`](https://github.com/astral-sh/uv) (Python package manager)
- **Node.js 20+** and [`pnpm`](https://pnpm.io/)
- **Docker** & Docker Compose (for Qdrant + Postgres)
- API keys for: **OpenAI**, **Cohere**, **Groq**, **Cloudinary**

---

### 1. Clone the repository

```bash
git clone <your-repo-url> DocsAI
cd DocsAI
```

---

### 2. Backend setup (`docsai-backend/`)

```bash
cd docsai-backend
```

#### Configure environment variables

Create a `.env` file in `docsai-backend/`:

```env
# LLM / embeddings
OPENAI_API_KEY=sk-...
COHERE_API_KEY=...
GROQ_API_KEY=...

# Vector DB
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=               # leave empty for local

# Postgres (matches docker-compose.yml)
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/docsai

# Cloudinary (PDF storage)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Auth
JWT_SECRET=replace-with-a-long-random-string
JWT_ALGORITHM=HS256
```

#### Start infrastructure

```bash
docker compose up -d
```

This starts:
- **Qdrant** → `http://localhost:6333`
- **Postgres** → `localhost:5432`
- **pgAdmin** → `http://localhost:5050`

#### Install dependencies & run

```bash
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

Backend is now live at **`http://localhost:8000`**, API base path **`/api/v1`**.

---

### 3. Frontend setup (`docsai_frontend/`)

```bash
cd ../docsai_frontend
pnpm install
pnpm dev
```

Frontend is now live at **`http://localhost:3000`**.

> The frontend points to `http://localhost:8000/api` by default (see `src/lib/api.ts`).

---

## 🔌 API Reference

All endpoints are prefixed with `/api/v1`. Authentication is enforced via the `access_token` HTTP-only cookie.

### Auth (`/auth`)

| Method | Endpoint    | Description                            |
| ------ | ----------- | -------------------------------------- |
| POST   | `/register` | Create account, returns auth cookie    |
| POST   | `/login`    | Verify credentials, returns auth cookie |
| POST   | `/logout`   | Clears auth cookie                     |

### Documents

| Method | Endpoint           | Description                                                |
| ------ | ------------------ | ---------------------------------------------------------- |
| POST   | `/ingest-docs`     | Upload PDF (≤ 10 MB), streams ingestion progress          |
| GET    | `/documents`       | Fetch document metadata for a `thread_id`                  |
| GET    | `/threads`         | List all threads / documents for the current user          |

### Chat

| Method | Endpoint            | Description                                                    |
| ------ | ------------------- | -------------------------------------------------------------- |
| POST   | `/chat-completion`  | Streams generated answer tokens + source citations via SSE    |
| GET    | `/messages`         | Returns full message history for a `thread_id`                 |

---

## 🧰 Tech Stack

### Backend
- **FastAPI** — async web framework
- **LangGraph** — orchestration of ingestion & chat flows
- **Qdrant** — hybrid vector search (dense + sparse)
- **OpenAI** — dense embeddings
- **SPLADE** — sparse embeddings
- **Cohere** — reranking
- **Groq (Llama 3.3 70B)** — chat completion
- **PostgreSQL** + **SQLAlchemy** (async) — relational storage
- **AsyncPostgresSaver** — LangGraph chat checkpointing
- **pdfplumber** — PDF text + position extraction
- **Cloudinary** — PDF storage
- **JWT (jose)** + **passlib (bcrypt)** — auth

### Frontend
- **Next.js 16** (App Router) + **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **Radix UI** — accessible primitives
- **Framer Motion** — animations
- **Zustand** — state management
- **lucide-react** — icons

---

## 🔒 Security Notes

- Passwords are hashed with bcrypt (`passlib`) — never stored in plaintext.
- JWTs are delivered as **HTTP-only cookies**; auth middleware bypasses only public routes (login, register, etc.).
- CORS is restricted to `http://localhost:3000` by default — update `app/main.py` for production origins.
- File uploads are validated by **MIME type** *and* a **content-based legal-document classifier** (GPT-4o-mini) before any processing.

---

## 🗺️ Roadmap

- [ ] Multi-document threads / cross-document queries
- [ ] Support for DOCX & TXT in addition to PDF
- [ ] Full-text highlight-on-citation in the PDF viewer
- [ ] Role-based access & shared workspaces
- [ ] Export chat transcripts (PDF / Markdown)
- [ ] Self-hosted LLM option (Ollama / vLLM)

---

## 🤝 Contributing

PRs are welcome! Please:
1. Open an issue to discuss substantial changes first.
2. Match the existing code style (Black/ruff for Python, ESLint for TS).
3. Include a clear description and test instructions in your PR.

---

## 📄 License

This project is released under the MIT License — see `LICENSE` for details.

---

## 🙏 Acknowledgements

Built with [LangGraph](https://github.com/langchain-ai/langgraph), [Qdrant](https://qdrant.tech/), [FastAPI](https://fastapi.tiangolo.com/), and [Next.js](https://nextjs.org/).
