"""Handles all the authentication endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from ..core.database import get_db
from ..services.user_service import UserService
from ..core.auth import verify_token

router = APIRouter()
security = HTTPBearer()

class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    session_id: Optional[str] = None

class UserLoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    is_active: bool
    created_at: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class LinkSessionRequest(BaseModel):
    session_id: str

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Gets the current authenticated user from a token"""
    try:
        payload = verify_token(credentials.credentials)
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        user_service = UserService(db)
        user = user_service.get_user_by_id(int(user_id))
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        return user
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db)
):
    """
    Get current authenticated user, but dont error if no token.
    this is for endpoints that can be used by both anon and logged-in users
    """
    if not credentials:
        return None
    
    try:
        payload = verify_token(credentials.credentials)
        user_id = payload.get("sub")
        if user_id is None:
            return None
        
        user_service = UserService(db)
        user = user_service.get_user_by_id(int(user_id))
        return user
    except Exception:
        return None

@router.post("/register", response_model=AuthResponse)
async def register(
    request: UserRegisterRequest,
    db: Session = Depends(get_db)
):
    """Register a new user account."""
    user_service = UserService(db)
    
    try:
        # create the user and get a token
        user, token = user_service.create_user(
            email=request.email,
            password=request.password,
            session_id=request.session_id
        )
        
        return AuthResponse(
            access_token=token,
            user=UserResponse(
                id=user.id,
                email=user.email,
                is_active=user.is_active,
                created_at=user.created_at.isoformat()
            )
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login", response_model=AuthResponse)
async def login(
    request: UserLoginRequest,
    db: Session = Depends(get_db)
):
    """auth user and return token."""
    user_service = UserService(db)
    
    try:
        user, login_token = user_service.authenticate_user(request.email, request.password)
        
        return AuthResponse(
            access_token=login_token,
            user=UserResponse(
                id=user.id,
                email=user.email,
                is_active=user.is_active,
                created_at=user.created_at.isoformat()
            )
        )
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user = Depends(get_current_user)):
    """gets current user's info"""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        is_active=current_user.is_active,
        created_at=current_user.created_at.isoformat()
    )

@router.post("/link-session")
async def link_session_to_user(
    request: LinkSessionRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Link an anonymous session to the current user."""
    user_service = UserService(db)
    
    success = user_service.link_session_to_user(request.session_id, current_user.id)
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to link session")
    
    return {"message": "Session linked successfully"}

@router.post("/logout")
async def logout():
    """Logout user... the client just needs to delete the token."""
    return {"message": "Logged out successfully"}

@router.post("/verify-token")
async def verify_user_token(current_user = Depends(get_current_user)):
    """verifys if the provided token is valid."""
    return {"valid": True, "user_id": current_user.id} 