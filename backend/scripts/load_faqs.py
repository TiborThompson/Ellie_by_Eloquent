"""Script to load FAQ data into Pinecone."""
import sys
import os
import markdown
from bs4 import BeautifulSoup
from typing import List, Dict, Any

# Add app directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from app.core.vector_store import VectorStore

def parse_markdown_file(file_path: str) -> List[Dict[str, Any]]:
    """Parse markdown file into documents."""
    with open(file_path, 'r') as f:
        md_content = f.read()
    
    # Convert markdown to HTML
    html = markdown.markdown(md_content)
    soup = BeautifulSoup(html, 'html.parser')
    
    documents = []
    current_section = ""
    
    # Process each heading and its content
    for element in soup.find_all(['h2', 'h3', 'p', 'ul', 'ol']):
        if element.name == 'h2':
            current_section = element.text.strip()
        elif element.name == 'h3':
            # Question is in h3, answer follows
            question = element.text.strip()
            answer_elements = []
            
            # Get all elements until next h2 or h3
            next_element = element.next_sibling
            while next_element and not (
                next_element.name == 'h2' or 
                next_element.name == 'h3'
            ):
                if next_element.name in ['p', 'ul', 'ol']:
                    answer_elements.append(str(next_element))
                next_element = next_element.next_sibling
            
            # Combine answer elements
            answer = ' '.join(answer_elements)
            answer = BeautifulSoup(answer, 'html.parser').get_text()
            
            # Create document
            documents.append({
                "text": f"Q: {question}\nA: {answer}",
                "metadata": {
                    "section": current_section,
                    "question": question,
                    "type": "faq"
                }
            })
    
    return documents

def main():
    """Main function."""
    # Initialize vector store
    vector_store = VectorStore()
    
    # Load and parse FAQ data
    faq_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'fintech_faqs.md')
    documents = parse_markdown_file(faq_path)
    
    print(f"Loaded {len(documents)} FAQ documents")
    
    # Add to vector store
    print("Adding documents to Pinecone...")
    vector_store.add_documents(documents)
    print("Done!")

if __name__ == "__main__":
    main() 