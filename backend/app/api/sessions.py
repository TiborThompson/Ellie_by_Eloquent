"""Api endpoints for session management."""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from ..core.database import get_db
from ..services.session_service import SessionService
from ..api.auth import get_current_user_optional

router = APIRouter()

class SessionResponse(BaseModel):
    session_id: str
    is_anonymous: bool
    created_at: str
    last_activity: str
    message_count: int

class ChatHistoryResponse(BaseModel):
    messages: List[Dict[str, Any]]
    session_info: SessionResponse

@router.post("/session/create")
async def create_session(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_optional)
):
    """Create a new session. Anonymous or linked to a user"""
    service = SessionService(db)
    
    if current_user:
        # Create session linked to the user
        session_id = service.create_user_session(current_user.id)
    else:
        # Create anonymous session
        session_id = service.create_anonymous_session()
    
    session_info = service.get_session_info(session_id)
    
    return {
        "session_id": session_id,
        "session_info": session_info
    }

@router.get("/session/{session_id}")
async def get_session(session_id: str, db: Session = Depends(get_db)):
    """Get info for a session."""
    service = SessionService(db)
    session_info = service.get_session_info(session_id)
    
    if not session_info:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return session_info

@router.delete("/session/{session_id}")
async def delete_session(
    session_id: str, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_optional)
):
    """Delete a session and its chat history"""
    service = SessionService(db)
    
    # Check if the session exists
    session_info = service.get_session_info(session_id)
    if not session_info:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # For auth'd users, verify they own the session
    if current_user:
        session_model = service.get_session_model(session_id)
        if session_model and session_model.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this session")
    
    # Delete it
    success = service.delete_session(session_id)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete session")
    
    return {"message": "Session deleted successfully"}

@router.get("/session/{session_id}/history")
async def get_chat_history(
    session_id: str, 
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get chat history for a session"""
    service = SessionService(db)
    
    # Check if session exists first
    session_info = service.get_session_info(session_id)
    if not session_info:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get chat history
    messages = service.get_chat_history(session_id, limit)
    
    return {
        "messages": messages,
        "session_info": session_info
    }

@router.get("/sessions/my-chats")
async def get_my_chat_sessions(
    current_user = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Get all chat sessions for the current user, with previews"""
    if not current_user:
        return {"sessions": [], "total": 0}
    
    service = SessionService(db)
    sessions = service.get_user_sessions_with_preview(current_user.id)
    
    return {
        "sessions": sessions,
        "total": len(sessions)
    }

@router.delete("/session/{session_id}/history")
async def clear_chat_history(session_id: str, db: Session = Depends(get_db)):
    """Clear chat history for a session (for future implementation)."""
    # Todo: implement this later, for now just return success
    return {"message": "Chat history clearing not implemented yet"}

# Helper to get session ID from header
def get_session_id(x_session_id: Optional[str] = Header(None)) -> Optional[str]:
    """Extract session ID from the request header."""
    return x_session_id 