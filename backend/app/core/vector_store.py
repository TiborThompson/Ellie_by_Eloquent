"""Pinecone vector store operations."""
from pinecone import Pinecone, ServerlessSpec
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any
import hashlib
import json

from .settings import get_settings

class VectorStore:
    """Vector store for embeddings using pinecone."""
    
    def __init__(self):
        """Initialize the vector store."""
        settings = get_settings()
        # Init pinecone
        self.pc = Pinecone(api_key=settings.pinecone_api_key)
        
        # Init embedding model
        print("Loading embedding model...")
        self.embedding_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
        
        # Get or create the index
        indexes = self.pc.list_indexes()
        if settings.pinecone_index not in [idx.name for idx in indexes]:
            print(f"Creating index: {settings.pinecone_index}")
            self.pc.create_index(
                name=settings.pinecone_index,
                dimension=384,  # all-MiniLM-L6-v2's dimension
                metric="cosine",
                spec=ServerlessSpec(
                    cloud=settings.pinecone_cloud,
                    region=settings.pinecone_region
                )
            )
        
        self.index = self.pc.Index(settings.pinecone_index)
    
    def _get_embedding(self, text: str) -> List[float]:
        """Get embedding for a piece of text."""
        return self.embedding_model.encode(text).tolist()
    
    def _generate_id(self, text: str, metadata: Dict[str, Any]) -> str:
        """Generate a deterministic ID for a doc."""
        content = json.dumps({"text": text, "metadata": metadata}, sort_keys=True)
        return hashlib.sha256(content.encode()).hexdigest()
    
    def add_documents(self, documents: List[Dict[str, Any]]):
        """
        Add documents to the vector store.
        
        Documents should be a list of dicts, each with:
        - text: the document text
        - metadata: other doc metadata (optional)
        """
        vectors = []
        
        for doc in documents:
            text = doc["text"]
            metadata = doc.get("metadata", {})
            
            # Gen embedding
            embedding = self._get_embedding(text)
            
            # Gen id
            doc_id = self._generate_id(text, metadata)
            
            # Prep vector for pinecone
            vector = {
                "id": doc_id,
                "values": embedding,
                "metadata": {
                    "text": text,
                    **metadata
                }
            }
            
            vectors.append(vector)
        
        # Upsert in batches of 100 to be safe
        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i + batch_size]
            self.index.upsert(vectors=batch)
    
    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Search for similar documents.
        Returns a list of documents with their similarity scores
        """
        # Get the query embedding
        query_embedding = self._get_embedding(query)
        
        # Search pinecone
        results = self.index.query(
            vector=query_embedding,
            top_k=top_k,
            include_metadata=True
        )
        
        # Format the results
        documents = []
        for match in results.matches:
            documents.append({
                "text": match.metadata["text"],
                "metadata": {k: v for k, v in match.metadata.items() if k != "text"},
                "similarity": match.score
            })
        
        return documents 