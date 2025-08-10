"""Service for session management."""
from sqlalchemy.orm import Session
from ..models.database import Session as SessionModel, ChatMessage, User
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any

class SessionService:
    """Handles user sessions and chat history"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_anonymous_session(self) -> str:
        """Make a new anonymous session."""
        session_id = str(uuid.uuid4())
        session = SessionModel(
            id=session_id,
            is_anonymous=True,
            user_id=None
        )
        self.db.add(session)
        self.db.commit()
        return session_id
    
    def create_user_session(self, user_id: int) -> str:
        """Make a new session and link it to a user"""
        session_id = str(uuid.uuid4())
        session = SessionModel(
            id=session_id,
            is_anonymous=False,
            user_id=user_id
        )
        self.db.add(session)
        self.db.commit()
        return session_id
    
    def get_or_create_session(self, session_id: Optional[str] = None) -> str:
        """Get an existing session or create a new one"""
        if session_id:
            session = self.db.query(SessionModel).filter(SessionModel.id == session_id).first()
            if session:
                # Update last activity timestamp
                session.last_activity = datetime.utcnow()
                self.db.commit()
                return session_id
        
        # No session found, so create a new anonymous one
        return self.create_anonymous_session()
    
    def get_session_model(self, session_id: str) -> Optional[SessionModel]:
        """Gets the raw session model object"""
        return self.db.query(SessionModel).filter(SessionModel.id == session_id).first()
    
    def delete_session(self, session_id: str) -> bool:
        """Deletes a session and all its msgs."""
        try:
            # Delete all messages for this session
            self.db.query(ChatMessage).filter(ChatMessage.session_id == session_id).delete()
            
            # Then delete the session itself
            session = self.db.query(SessionModel).filter(SessionModel.id == session_id).first()
            if session:
                self.db.delete(session)
                self.db.commit()
                return True
            return False
        except Exception as e:
            print(f"Error deleting session: {e}")
            self.db.rollback()
            return False
    
    def save_message(self, session_id: str, role: str, content: str) -> bool:
        """Saves a chat message to the db"""
        try:
            message = ChatMessage(
                session_id=session_id,
                role=role,
                content=content
            )
            self.db.add(message)
            self.db.commit()
            return True
        except Exception as e:
            print(f"Error saving message: {e}")
            self.db.rollback()
            return False
    
    def get_chat_history(self, session_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get the chat history for a session."""
        messages = (
            self.db.query(ChatMessage)
            .filter(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at)
            .limit(limit)
            .all()
        )
        
        return [
            {
                "role": msg.role,
                "content": msg.content,
                "timestamp": msg.created_at.isoformat()
            }
            for msg in messages
        ]
    
    def get_session_info(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get a session's info"""
        session = self.db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if not session:
            return None
        
        return {
            "session_id": session.id,
            "is_anonymous": session.is_anonymous,
            "created_at": session.created_at.isoformat(),
            "last_activity": session.last_activity.isoformat(),
            "message_count": len(session.messages)
        }
    
    def get_user_sessions_with_preview(self, user_id: int) -> List[Dict[str, Any]]:
        """
        Get user sessions with a preview of the chat
        for the sidebar
        """
        sessions = (
            self.db.query(SessionModel)
            .filter(SessionModel.user_id == user_id)
            .order_by(SessionModel.last_activity.desc())
            .all()
        )
        
        result = []
        for session in sessions:
            # Get the first user message as a preview
            first_message = (
                self.db.query(ChatMessage)
                .filter(ChatMessage.session_id == session.id, ChatMessage.role == "user")
                .order_by(ChatMessage.created_at.asc())
                .first()
            )
            
            preview_text = "New Chat"
            if first_message:
                preview_text = first_message.content[:50] + ("..." if len(first_message.content) > 50 else "")
            
            result.append({
                "session_id": session.id,
                "preview": preview_text,
                "message_count": len(session.messages),
                "last_activity": session.last_activity.isoformat(),
                "created_at": session.created_at.isoformat()
            })
        
        return result
    
    def link_session_to_user(self, session_id: str, user_Id: int) -> bool:
        """Link an anon session to a user account."""
        try:
            session = self.db.query(SessionModel).filter(SessionModel.id == session_id).first()
            if session and session.is_anonymous:
                session.user_id = user_Id
                session.is_anonymous = False
                self.db.commit()
                return True
            return False
        except Exception as e:
            print(f"Error linking session to user: {e}")
            self.db.rollback()
            return False 