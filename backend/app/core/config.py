"""Configuration constants for the application."""

# Gemini API configuration
GEMINI_MODEL = "gemini-2.5-pro"  # Single source of truth for model name

# Pinecone configuration
PINECONE_API_KEY = ""  # Use environment variable instead
PINECONE_INDEX = "fintech-faq"  # Our index name
PINECONE_CLOUD = "aws"  # Cloud provider
PINECONE_REGION = "us-east-1"  # Region for serverless
PINECONE_EMBED_MODEL = "llama-text-embed-v2"  # Pinecone's integrated embedding model 