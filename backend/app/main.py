from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .api.chat import router as chat_router
from .api.sessions import router as sessions_router
from .api.auth import router as auth_router
from .core.database import create_tables

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("--- Server starting up... ---")
    # Init database tables
    create_tables()
    print("Database tables created/verified")
    # Lazy initialization of the chatbot happens in a request dependency
    yield
    print("--- Server shutting down... ---")

app = FastAPI(title="Ellie by Eloquent AI", lifespan=lifespan)

# Define allowed origins
origins = ["http://localhost:5173", "http://127.0.0.1:5173"]

# Config CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the routers
app.include_router(chat_router, prefix="/api", tags=["chat"])
app.include_router(sessions_router, prefix="/api", tags=["sessions"]) 
app.include_router(auth_router, prefix="/api/auth", tags=["authentication"])

@app.get("/health")
async def health_check():
    return {"status": "healthy"} 