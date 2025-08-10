"""Script to list Pinecone indexes."""
import sys
import os

# Add app directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from app.core.config import PINECONE_API_KEY

from pinecone import Pinecone

def main():
    """Main function."""
    # Initialize Pinecone
    pc = Pinecone(api_key=PINECONE_API_KEY)
    
    # List indexes
    print("Available indexes:")
    indexes = pc.list_indexes()
    for index in indexes:
        print(f"- {index.name}")
        print(f"  Host: {index.host}")
        print(f"  Dimension: {index.dimension}")
        print(f"  Metric: {index.metric}")
        print(f"  Status: {index.status}")
        print()

if __name__ == "__main__":
    main() 