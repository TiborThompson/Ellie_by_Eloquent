#!/usr/bin/env python3
"""Script to check Pinecone index and load FAQ data if needed."""
import sys
import os

# Add app directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.vector_store import VectorStore
from load_faqs import parse_markdown_file

def main():
    """Check if Pinecone has data and load if needed."""
    try:
        print("Checking Pinecone index status...")
        
        # Initialize vector store
        vector_store = VectorStore()
        
        # Check if index has data by doing a test query
        try:
            test_results = vector_store.search("test query", top_k=1)
            
            if test_results and len(test_results) > 0:
                print(f"✓ Pinecone index has data ({len(test_results)} results found)")
                return
            else:
                print("⚠ Pinecone index appears to be empty")
        except Exception as e:
            print(f"⚠ Could not query Pinecone index: {e}")
        
        # Load FAQ data
        print("Loading FAQ data into Pinecone...")
        faq_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'fintech_faqs.md')
        
        if not os.path.exists(faq_path):
            print(f"✗ FAQ file not found: {faq_path}")
            return
        
        documents = parse_markdown_file(faq_path)
        print(f"Parsed {len(documents)} FAQ documents")
        
        # Add to vector store
        print("Adding documents to Pinecone...")
        vector_store.add_documents(documents)
        print("✓ FAQ data loaded successfully!")
        
    except Exception as e:
        print(f"✗ Error: {e}")
        print("You may need to check your Pinecone API key and configuration")

if __name__ == "__main__":
    main() 