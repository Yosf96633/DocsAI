from typing import TypedDict
from langgraph.graph import  add_messages
from langchain_core.messages import BaseMessage
from typing import TypedDict , Annotated , List , Optional

class ChatState(TypedDict):
    messages : Annotated[List[BaseMessage] , add_messages]
    context: Annotated[str, "context"] 
    sources: Optional[list]