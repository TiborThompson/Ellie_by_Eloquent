"""User management stuff."""
from sqlalchemy.orm import Session
from ..models.database import User, Session as SessionModel
from ..core.auth import hash_password, verify_password, create_access_token
from .session_service import SessionService
from typing import Optional, Tuple
import re

class UserService:
    """Service for user management and auth."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def validate_email(self, email: str) -> bool:
        """Basic email format validation"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    def validate_password(self, password: str) -> bool:
        """Basic password strength validation"""
        return len(password) >= 8
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get a user by their email"""
        return self.db.query(User).filter(User.email == email).first()
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by id"""
        return self.db.query(User).filter(User.id == user_id).first()
    
    def create_user(self, email: str, password: str, session_id: Optional[str] = None) -> Tuple[User, str]:
        """
        Create a new user account.
        Returns the user and an access token
        """
        # Some validation
        if not self.validate_email(email):
            raise ValueError("Invalid email format")
        
        if not self.validate_password(password):
            raise ValueError("Password must be at least 8 characters long")
        
        # Check if user exists
        if self.get_user_by_email(email):
            raise ValueError("User with this email already exists")
        
        try:
            # Create the user
            hashed_password = hash_password(password)
            user = User(
                email=email,
                hashed_password=hashed_password,
                is_active=True
            )
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
            
            # Create token
            access_token = create_access_token(data={"sub": str(user.id)})
            
            # Link session if we have one
            if session_id:
                session_service = SessionService(self.db)
                session_service.link_session_to_user(session_id, user.id)
            
            return user, access_token
            
        except Exception as e:
            self.db.rollback()
            raise ValueError(f"Failed to create user: {str(e)}")
    
    def authenticate_user(self, email: str, password: str) -> Tuple[User, str]:
        """Auth a user and return user and token."""
        user = self.get_user_by_email(email)
        
        if not user:
            raise ValueError("Invalid email or password")
        
        if not user.is_active:
            raise ValueError("Account is disabled")
        
        if not verify_password(password, user.hashed_password):
            raise ValueError("Invalid email or password")
        
        # Create access token
        access_token = create_access_token(data={"sub": str(user.id)})
        
        return user, access_token
    
    def link_session_to_user(self, session_id: str, user_id: int) -> bool:
        """Link an anonymous session to a user account"""
        session_service = SessionService(self.db)
        return session_service.link_session_to_user(session_id, user_id)
    
    def get_user_sessions(self, user_id: int) -> list:
        """Get all sessions for a user"""
        sessions = self.db.query(SessionModel).filter(SessionModel.user_id == user_id).all()
        return [
            {
                "session_id": session.id,
                "is_anonymous": session.is_anonymous,
                "created_at": session.created_at.isoformat(),
                "last_activity": session.last_activity.isoformat(),
                "message_count": len(session.messages)
            }
            for session in sessions
        ] 