from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_qdrant import QdrantVectorStore, RetrievalMode
from langchain_qdrant.fastembed_sparse import FastEmbedSparse
from langchain_cohere import CohereRerank
from langchain_classic.retrievers import ContextualCompressionRetriever
from langchain_core.messages import AIMessage
from langchain_groq import ChatGroq
from qdrant_client.models import Filter, FieldCondition, MatchValue
from langgraph.config import RunnableConfig
from app.core import clients
from .model import ChatState
from .prompts import chat_prompt


async def retrieval_node(state: ChatState, config: RunnableConfig):
    thread_id = config["configurable"]["thread_id"]

    # Last human message is the query
    query = state['messages'][-1].content

    vector_store = QdrantVectorStore(
        client=clients.qdrant,
        collection_name="legal_docs",
        embedding=OpenAIEmbeddings(model="text-embedding-3-small"),
        retrieval_mode=RetrievalMode.HYBRID,
        sparse_embedding=FastEmbedSparse(model_name="prithvida/Splade_PP_en_v1"),
        vector_name="dense",
        sparse_vector_name="sparse",
        content_payload_key="text",
    )

    base_retriever = vector_store.as_retriever(
        search_kwargs={
            "k": 10,
            "filter": Filter(
                must=[FieldCondition(key="thread_id", match=MatchValue(value=thread_id))]
            )
        }
    )

    reranker = CohereRerank(model="rerank-english-v3.0", top_n=4)
    compressor = ContextualCompressionRetriever(
        base_compressor=reranker,
        base_retriever=base_retriever
    )

    docs = await compressor.ainvoke(query)
    docs = [doc for doc in docs if doc.page_content.strip()]

    # Build rich context string with all metadata
    context = "\n\n".join([
        (
            f"[Source: {doc.metadata.get('document')} | "
            f"Page {doc.metadata.get('page')} | "
            f"{doc.metadata.get('position_label', '').capitalize()} | "
            f"Clauses: {', '.join(doc.metadata.get('clause_refs', [])) or 'N/A'} | "
            f"Citation: {doc.metadata.get('citation_label', 'N/A')}]\n"
            f"{doc.page_content}"
        )
        for doc in docs
    ])

    # Build sources list for frontend
    sources = [
        {
            "document": doc.metadata.get("document"),
            "page": doc.metadata.get("page"),
            "position": doc.metadata.get("position_label"),
            "clause_refs": doc.metadata.get("clause_refs", []),
            "citation_label": doc.metadata.get("citation_label"),
            "parties": doc.metadata.get("parties", []),
            "dates": doc.metadata.get("dates", []),
            "key_obligations": doc.metadata.get("key_obligations", []),
        }
        for doc in docs
    ]

    return {
        "context": context,
        "sources": sources,  
    }


async def generation_node(state: ChatState):
    model = ChatGroq(model="llama-3.3-70b-versatile", temperature=0, streaming=True)
    chain = chat_prompt | model

    response = await chain.ainvoke({
        "context": state['context'],
        "messages": state["messages"],
    })

    return {"messages": [AIMessage(content=response.content)]}