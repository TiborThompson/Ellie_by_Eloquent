# Ellie, by Eloquent AI

Ellie is an AI-powered chatbot from Eloquent AI. It's designed to provide intelligent assistance for a fintech company. It uses Retrieval-Augmented Generation (RAG) to deliver accurate, context-aware responses by leveraging a Pinecone vector database. The application is built with a Python FastAPI backend and a React + TypeScript frontend, and features a modern, persistent chat environment for both anonymous and authenticated users.

![Ellie, by Eloquent AI](./ellie.png)

## Key Features

-   **RAG-Powered Chatbot**: Retrieves relevant context from a fintech FAQ knowledge base before generating responses. This helps with accuracy and reduces hallucinations.
-   **Modern UI**: A responsive and intuitive chat interface built with Tailwind CSS.
-   **User Authentication**: Supports both anonymous and registered users with a complete authentication system (register, login, logout) using JWT.
-   **Persistent Chat History**: Conversations are saved to a database, allowing users to view and continue their chat history across sessions.
-   **Advanced Frontend**:
    -   Chat history sidebar with session management.
    -   Welcome screen with starter prompts.
    -   Smooth loading states and transitions.
    -   Ability to type responses while the AI is generating its reply.
    -   Intelligent logout flow that saves the current chat to the user's account.
-   **Automated Setup**: A simple `start.sh` script handles environment setup, data loading, and server startup.
-   **AWS Ready**: Designed for a straightforward deployment to AWS.

## Tech Stack

| Area      | Technology                                    |
| :-------- | :-------------------------------------------- |
| **Backend** | Python, FastAPI, SQLAlchemy, Uvicorn        |
| **Frontend**| React, TypeScript, Vite, Tailwind CSS    |
| **AI/ML**   | Google Gemini, Sentence Transformers        |
| **Database**| Pinecone (Vector DB), SQLite (Session DB)   |
| **Auth**    | JWT, passlib[bcrypt]                          |

---

## Getting Started

### Prerequisites

-   Python 3.10+
-   Node.js 18+
-   An active virtual environment (`python3 -m venv venv`)

### 1. Clone the repo

```bash
git clone https://github.com/your-username/eloquent-ai.git
cd eloquent-ai
```

### 2. Setup Environment Variables

Create a `.env` file in the project root by copying the example:

```bash
cp .env.example .env
```

Now, open the `.env` file and add your API keys:

```dotenv
# Get from Google AI Studio or Google Cloud
GEMINI_API_KEY="your-google-gemini-api-key"

# Get from your Pinecone account
PINECONE_API_KEY="your-pinecone-api-key"

# Optional: You can customize the Pinecone index details
PINECONE_INDEX="fintech-faq"

# Secret key for JWT authentication (change this to a random string)
JWT_SECRET_KEY="a-very-secret-key-that-you-should-change"
```

### 3. Install Dependencies

The `start.sh` script can handle this, but you can also install them manually.

**Backend (Python):**

```bash
# Activate your virtual environment first
source venv/bin/activate

pip install -r backend/requirements.txt
```

**Frontend (Node.js):**

```bash
cd frontend
npm install
cd ..
```

### 4. Run the Application

The easiest way to start the whole application is with the `start.sh` script. It handles:
-   Activating the virtual environment.
-   Loading environment variables from `.env`.
-   Checking if Pinecone needs to be seeded with data (and loads it if needed).
-   Starting both the backend and frontend servers.

```bash
./start.sh
```

-   **Backend** will be running at `http://localhost:8000`
-   **Frontend** will be running at `http://localhost:5173`

Open `http://localhost:5173` in your browser to start chatting.

---

## Project Structure

```
eloquent-ai/
├── .gitignore
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers (chat, auth, sessions)
│   │   ├── core/         # Core logic (auth, chatbot, database, settings)
│   │   ├── models/       # SQLAlchemy ORM models
│   │   ├── services/     # Business logic (user, session services)
│   │   └── main.py       # FastAPI app entry point
│   ├── scripts/        # Utility scripts (data loading)
│   └── requirements.txt
├── data/
│   └── fintech_faq.json  # Knowledge base for the RAG system
├── frontend/
│   ├── src/
│   │   ├── components/   # React components (Sidebar, AuthModal)
│   │   └── App.tsx       # Main application component
│   └── package.json
├── README.md
├── Deployment.md       # AWS Deployment Strategy
└── start.sh            # Main startup script
```

## AWS Deployment Strategy

For details on deploying this application to AWS, see the [AWS Deployment Strategy](Deployment.md) document. 