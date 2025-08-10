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

# --- Docker Check & Auto-Installation ---
# Check if Docker is installed
if ! command -v docker &>/dev/null; then
    echo "Docker is not found on your system."
    read -p "Would you like to attempt to install it automatically? (y/n) " -n 1 -r
    echo # Move to a new line
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Attempting to install Docker and the Compose plugin..."
        # Check for sudo privileges
        if ! command -v sudo &>/dev/null; then
            echo >&2 "Error: 'sudo' command not found. Please install Docker manually and re-run this script."
            exit 1
        fi
        # Install Docker, the compose plugin, and add user to the docker group
        sudo apt-get update && sudo apt-get install -y docker.io docker-compose-plugin
        sudo usermod -aG docker $USER
        echo "Docker installed successfully."
        echo "IMPORTANT: For permissions to apply, you may need to log out and log back in, or reboot."
        echo "The script will attempt to continue using the 'sg' command for now."
    else
        echo "User declined automatic installation."
        echo "Please install Docker and the Docker Compose plugin manually, then re-run this script."
        echo "On Debian/Ubuntu systems, you can typically do this with:"
        echo "  sudo apt-get update"
        echo "  sudo apt-get install -y docker.io docker-compose-plugin"
        echo "  sudo usermod -aG docker \$USER"
        echo "After installation, please log out and log back in before running this script again."
        exit 1
    fi
fi
echo "Docker command found."

# --- Docker Daemon Check ---
# Check if the Docker daemon is running and accessible
if ! sg docker -c "docker info" &>/dev/null; then
    echo "Docker is installed, but the daemon is not running or accessible."
    echo "Attempting to start the Docker service..."
    if command -v systemctl &>/dev/null; then
        sudo systemctl start docker
    fi

    # Perform a final check
    if ! sg docker -c "docker info" &>/dev/null; then
      echo >&2 "Error: Could not connect to the Docker daemon."
      echo >&2 "Please ensure Docker is running and that your user is in the 'docker' group."
      echo >&2 "You may need to log out and log back in for group changes to take effect."
      echo >&2 "You can try starting it manually with: sudo systemctl start docker"
      exit 1
    fi
fi
echo "Docker is installed and running."


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