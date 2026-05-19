# graph.py
from langgraph.graph import StateGraph, END
from .model import ChatState
from .nodes import retrieval_node, generation_node
from langgraph.graph.state import CompiledStateGraph

def build_chat_graph(checkpointer) -> CompiledStateGraph:
    workflow = StateGraph(ChatState)

    workflow.add_node("retrieval_node", retrieval_node)
    workflow.add_node("generation_node", generation_node)

    workflow.set_entry_point("retrieval_node")
    workflow.add_edge("retrieval_node", "generation_node")
    workflow.add_edge("generation_node", END)

    return workflow.compile(checkpointer=checkpointer)

# No chat_graph = build_chat_graph() here anymore