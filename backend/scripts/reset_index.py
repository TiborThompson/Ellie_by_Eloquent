"""Script to reset Pinecone index."""
import sys
import os

# Add app directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from app.core.config import (
    PINECONE_API_KEY,
    PINECONE_INDEX
)

from pinecone import Pinecone

def main():
    """Main function."""
    # Initialize Pinecone
    pc = Pinecone(api_key=PINECONE_API_KEY)
    
    # Delete index if it exists
    if PINECONE_INDEX in pc.list_indexes().names():
        print(f"Deleting index: {PINECONE_INDEX}")
        pc.delete_index(PINECONE_INDEX)
        print("Index deleted!")
    else:
        print("Index doesn't exist.")

if __name__ == "__main__":
    main() 