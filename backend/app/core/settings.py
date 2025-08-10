from pydantic import BaseModel
from dotenv import load_dotenv
import os
from functools import lru_cache

from . import config

class Settings(BaseModel):
    gemini_api_key: str
    pinecone_api_key: str
    pinecone_index: str = "fintech-faq"
    pinecone_cloud: str = "aws"
    pinecone_region: str = "us-east-1"
    gemini_model: str = "gemini-2.5-pro"

@lru_cache()
def get_settings():
    # Load .env from the root for portability
    dotenv_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env')
    load_dotenv(dotenv_path=dotenv_path)

    # Support a few common env var names for Gemini
    gemini_key = (
        os.getenv("GEMINI_API_KEY")
        or os.getenv("GOOGLE_API_KEY")
        or os.getenv("GENAI_API_KEY")
        or ""
    )

    pinecone_key = os.getenv("PINECONE_API_KEY") or config.PINECONE_API_KEY or ""

    pinecone_index = os.getenv("PINECONE_INDEX") or "fintech-faq"
    pinecone_cloud = os.getenv("PINECONE_CLOUD") or "aws"
    pinecone_region = os.getenv("PINECONE_REGION") or "us-east-1"
    gemini_model = os.getenv("GEMINI_MODEL") or "gemini-2.5-pro"

    return Settings(
        gemini_api_key=gemini_key,
        pinecone_api_key=pinecone_key,
        pinecone_index=pinecone_index,
        pinecone_cloud=pinecone_cloud,
        pinecone_region=pinecone_region,
        gemini_model=gemini_model,
    ) 