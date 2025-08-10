#!/bin/bash
clear
set -e

echo "--- Starting Eloquent AI Setup ---"

# --- Prerequisite Checks ---
echo ""
echo "--- 1. Checking prerequisites ---"
command -v python3 >/dev/null 2>&1 || { echo >&2 "Python 3 is not installed. Please install it to continue."; exit 1; }
echo "Python 3 found"
command -v node >/dev/null 2>&1 || { echo >&2 "Node.js is not installed. Please install it to continue."; exit 1; }
echo "Node.js found"
command -v docker >/dev/null 2>&1 || { echo >&2 "Docker is not installed. Please install it to continue."; exit 1; }
if ! sg docker -c "docker info" > /dev/null 2>&1; then
    echo >&2 "Docker is not running. Please start Docker Desktop to continue."
    exit 1
fi
echo "Docker found and running"


# --- Environment Setup ---
echo ""
echo "--- 2. Setting up environment variables ---"
if [ ! -f .env ]; then
    echo ".env file not found. Copying from .env.example..."
    cp .env.example .env
    echo ".env file created."
    echo "IMPORTANT: Please open the '.env' file in your editor and add your API keys now."
    read -p "Press [Enter] to continue after you have updated the .env file..."
else
    echo ".env file already exists."
fi


# --- Backend Dependencies ---
echo ""
echo "--- 3. Installing backend dependencies ---"
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
    echo "Virtual environment created."
fi

source venv/bin/activate
echo "Installing Python packages from backend/requirements.txt..."
pip install --timeout=3600 -r backend/requirements.txt
echo "Backend dependencies installed."
deactivate


# --- Frontend Dependencies ---
echo ""
echo "--- 4. Installing frontend dependencies ---"
cd frontend
echo "Installing Node.js packages..."
npm install
cd ..
echo "Frontend dependencies installed."


# --- Final Instructions ---
echo ""
echo "--- Setup Complete ---"
echo ""
echo "You can now start the application by running:"
echo "  ./start.sh"
echo "" 