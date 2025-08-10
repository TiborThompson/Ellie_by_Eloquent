"""The core chatbot implementation."""
import os
import sys
from typing import List, Dict, Any
import google.generativeai as genai

from .settings import get_settings
from .vector_store import VectorStore

class Chatbot:
    """The main chatbot class with RAG"""
    
    def __init__(self, api_key: str):
        """Init the chatbot with an api key."""
        settings = get_settings()
        if not api_key:
            print("Error: No API key provided", file=sys.stderr)
            raise ValueError("API key is required")
            
        print(f"Initializing chatbot with API key: {api_key[:10]}...")
        self.api_key = api_key
        
        # Config Gemini
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel(settings.gemini_model)
        print(f"Using Gemini model: {settings.gemini_model}")
        
        # Init vector store for RAG
        self.vector_store = VectorStore()
        
        # Convo history
        self.conversation_history: List[Dict[str, Any]] = []
        
    def _format_context(self, documents: List[Dict[str, Any]]) -> str:
        """Formats retrieved docs as context."""
        if not documents:
            return ""
        
        context = "Here is some context that might be relevant to the user's question:\n\n"
        for i, doc in enumerate(documents, 1):
            context += f"Context {i}:\n"
            context += f"Source: {doc['metadata'].get('section', 'Unknown')}\n"
            context += f"Content: {doc['text']}\n\n"
        
        return context
    
    def chat(self, user_message: str) -> str:
        """Process a user message and return a response."""
        try:
            print(f"Processing message: {user_message}")
            
            # 1. Retrieve relevant context
            print("Searching for relevant documents...")
            retrieved_docs = self.vector_store.search(user_message, top_k=3)
            
            # Debug: show what we got
            print(f"Retrieved {len(retrieved_docs)} documents:")
            for i, doc in enumerate(retrieved_docs, 1):
                section = doc['metadata'].get('section', 'Unknown')
                question = doc['metadata'].get('question', 'N/A')
                similarity = doc.get('similarity', 0)
                print(f"  {i}. Section: {section} | Question: {question} | Similarity: {similarity:.3f}")
            
            context = self._format_context(retrieved_docs)
            
            # 2. Build the prompt
            prompt = f"""You are "Ellie," an expert AI assistant for a fintech company. Your persona is helpful, professional, and confident.

Use the following context to answer the user's question.

**Core Instructions:**
- Answer the user's question directly and concisely.
- **Do not** mention the context, the documents, or the information provided. Act as if you already know the information.
- Format your answers using Markdown for clarity (e.g. lists, bold text).
- If the context is not relevant, simply state that you don't have the information and cannot answer the question. Do not try to guess.

Context:
{context}

Question:
{user_message}
"""
            
            # Add user message to history
            self.conversation_history.append({
                "role": "user",
                "parts": [{"text": user_message}]
            })
            
            # 3. Generate response
            print("Sending message to Gemini...")
            response = self.model.generate_content(prompt)
            response_text = response.text
            print(f"Got response: {response_text[:100]}...")
            
            # Add the response to history
            self.conversation_history.append({
                "role": "assistant",
                "parts": [{"text": response_text}]
            })
            
            return response_text
            
        except Exception as e:
            error_type = type(e).__name__
            print(f"Error in chat ({error_type}): {str(e)}", file=sys.stderr)
            return "I'm having trouble generating a response right now. Please try again."
    
    def get_conversation_history(self) -> List[Dict[str, Any]]:
        """Return the conversation history"""
        return self.conversation_history 