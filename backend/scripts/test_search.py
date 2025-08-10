"""Script to test FAQ search."""
import sys
import os

# Add app directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from app.core.vector_store import VectorStore

def main():
    """Main function."""
    # Initialize vector store
    vector_store = VectorStore()
    
    # Test queries
    test_queries = [
        "What's the maximum amount I can transfer?",
        "How do I protect my account from hackers?",
        "What documents do I need to verify my identity?",
        "How can I contact support if I have issues?",
        "What are the fees for international transfers?"
    ]
    
    # Test each query
    for query in test_queries:
        print(f"\nQuery: {query}")
        print("-" * 80)
        
        results = vector_store.search(query, top_k=2)
        
        for i, result in enumerate(results, 1):
            print(f"\nMatch {i} (Similarity: {result['similarity']:.3f}):")
            print(f"Section: {result['metadata']['section']}")
            print(f"Text:\n{result['text']}")

if __name__ == "__main__":
    main() 