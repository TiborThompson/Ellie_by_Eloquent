"""Database config and session stuff"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from ..models.database import Base
import os

# Database URL. Sqlite for simplicity.
# Can be changed to postgresql for production
DATABASE_URL = "sqlite:///./chat_sessions.db"

# Create engine
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_tables():
    """Create all the database tables."""
    Base.metadata.create_all(bind=engine)

def get_db():
    """Dependency for getting a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 