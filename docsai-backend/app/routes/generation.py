from fastapi import APIRouter , Request
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage
from pydantic import BaseModel
import json
from app.core import clients


router = APIRouter(prefix='/v1')

class RequestBody(BaseModel):
    thread_id: str
    query: str


async def generation_stream(thread_id: str, query: str):
    config = {"configurable": {"thread_id": thread_id}}

    yield f"data: {json.dumps({'type': 'status', 'message': 'Analyzing your query...'})}\n\n"

    # Stream graph, pick up sources + tokens
    sources_sent = False
    async for event in clients.chat_graph.astream_events(
        {"messages": [HumanMessage(content=query)]},
        config=config,
        version='v2'
    ):
        kind = event["event"]
        name = event.get("name", "")

        # After retrieval node finishes — grab sources from state
        if kind == "on_chain_end" and name == "retrieval_node":
            state = await clients.chat_graph.aget_state(config)
            sources = state.values.get("sources", [])
            if not sources_sent:
                yield f"data: {json.dumps({'type': 'sources', 'sources': sources})}\n\n"
                yield f"data: {json.dumps({'type': 'status', 'message': 'Generating response...'})}\n\n"
                sources_sent = True

        # Stream tokens from generation node
        if kind == "on_chat_model_stream" and event["data"].get("chunk"):
            token = event["data"]["chunk"].content
            if token:
                yield f"data: {json.dumps({'type': 'token', 'token': token})}\n\n"

    yield "data: [DONE]\n\n"


@router.post("/chat-completion")
async def generation(body: RequestBody):
    return StreamingResponse(
        generation_stream(body.thread_id, body.query),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )


@router.get("/messages")
async def get_messages(request : Request, thread_id: str):
    config = {"configurable": {"thread_id": thread_id}}
    state = await clients.chat_graph.aget_state(config)

    if not state or not state.values:
        return {"thread_id": thread_id, "messages": []}

    raw_messages = state.values.get("messages", [])

    messages = [
        {
            "role": "human" if msg.__class__.__name__ == "HumanMessage" else "ai",
            "content": msg.content,
        }
        for msg in raw_messages
    ]

    return {"thread_id": thread_id, "messages": messages}