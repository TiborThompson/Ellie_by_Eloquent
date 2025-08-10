#!/bin/bash
clear
set -e

# Load env vars from the root .env file
echo "--- Loading environment variables ---"
set -a
[ -f .env ] && source .env
set +a

# Stop any running containers first
if [ "$(docker-compose ps -q)" ]; then
    echo "--- Stopping existing containers ---"
    docker-compose down
fi

# Build and start services in the background
echo "--- Building and starting Docker containers ---"
docker-compose up --build -d

# tail the logs
echo "--- Attaching to logs (press Ctrl+C to detach) ---"
docker-compose logs -f 