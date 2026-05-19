# graph.py
from .nodes import LLM_check_node, rejection_node, citation_extraction_node,  chunking_node, embedding_and_inserting_node, route_to_rejection_or_chunking, save_to_cloudinary_and_db_node
from langgraph.graph import StateGraph, END
from .model import GraphState


def build_graph():
    workflow = StateGraph(GraphState)

    workflow.add_node("LLM_check_node", LLM_check_node)
    workflow.add_node("rejection_node", rejection_node)
    workflow.add_node("chunking_node", chunking_node)
    workflow.add_node("citation_extraction_node", citation_extraction_node)
    workflow.add_node("embedding_and_inserting_node",
                      embedding_and_inserting_node)
    workflow.add_node("save_to_cloudinary_and_db_node",
                      save_to_cloudinary_and_db_node)

    workflow.set_entry_point("LLM_check_node")

    workflow.add_conditional_edges(
        "LLM_check_node",
        route_to_rejection_or_chunking,
        {
            "chunking_node": "chunking_node",
            "rejection_node": "rejection_node",
        }
    )


    workflow.add_edge("chunking_node", "citation_extraction_node")        # 👈
    workflow.add_edge("citation_extraction_node", "embedding_and_inserting_node")
    workflow.add_edge("embedding_and_inserting_node" , "save_to_cloudinary_and_db_node")
    workflow.add_edge("save_to_cloudinary_and_db_node", END)
    workflow.add_edge("rejection_node", END)

    return workflow.compile()

graph = build_graph()
