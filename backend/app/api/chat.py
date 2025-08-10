"""Chat API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
import sys
from .. import state # Import the shared state
from ..core.chatbot import Chatbot
from ..core.settings import get_settings, Settings
from ..core.database import get_db
from ..services.session_service import SessionService

router = APIRouter()

# Dependency to get chatbot instance
def get_chatbot(settings: Settings = Depends(get_settings)):
    # This function depends on get_settings
    if state.chatbot_instance is None:
        # This part is now less likely to fail, but good for safety
        state.chatbot_instance = Chatbot(api_key=settings.gemini_api_key)
    return state.chatbot_instance

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str
    history: list

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest, 
    chatbot: Chatbot = Depends(get_chatbot),
    db: Session = Depends(get_db),
    x_session_id: Optional[str] = Header(None)
):
    """Main chat handler"""
    if not request.message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    try:
        # Init session service
        session_service = SessionService(db)
        
        # Get or create session... prioritize request body, then header
        session_id = request.session_id or x_session_id
        session_id = session_service.get_or_create_session(session_id)
        
        # Save user message
        session_service.save_message(session_id, "user", request.message)
        
        # Get chatbot response
        response = chatbot.chat(request.message)
        
        # Save assistant response
        session_service.save_message(session_id, "assistant", response)
        
        # Get updated chat history from db
        chat_history = session_service.get_chat_history(session_id)
        
        # Convert to the format frontend expects
        history = []
        for msg in chat_history:
            history.append({
                "role": msg["role"],
                "parts": [{"text": msg["content"]}]
            })
        
        return ChatResponse(
            response=response, 
            session_id=session_id,
            history=history
        )
        
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}", file=sys.stderr)
        raise HTTPException(status_code=500, detail=str(e)) 