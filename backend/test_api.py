import google.generativeai as genai
import os
from dotenv import load_dotenv

# Import our config
import sys
sys.path.append('app')
from core.config import GEMINI_MODEL

# Load environment variables
load_dotenv()

# Get API key
api_key = os.getenv("GEMINI_API_KEY")
print(f"Using API key: {api_key[:10]}...")

# Configure Gemini
genai.configure(api_key=api_key)

# List available models
print("\nAvailable models:")
for m in genai.list_models():
    print(m.name)

# Try a simple generation
print(f"\nUsing model: {GEMINI_MODEL}")
model = genai.GenerativeModel(GEMINI_MODEL)
print("\nTesting generation:")
response = model.generate_content("Say hello!")
print(response.text) 