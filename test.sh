#!/bin/bash
clear
set -e

echo "--- Starting Full Test Suite ---"

# --- Setup ---
echo ""
echo "--- 1. Setting up test environment ---"
if [ ! -d "venv" ]; then
    echo "Python virtual environment not found. Please run './setup.sh' first."
    exit 1
fi
source venv/bin/activate
# Make sure test dependencies are installed
pip install -q -r backend/requirements.txt
echo "Test environment ready."


# --- Stage 1: Unit & Integration Tests ---
echo ""
echo "--- 2. Running backend unit & integration tests with pytest ---"
# Set PYTHONPATH so pytest can find the backend modules
export PYTHONPATH=$(pwd)
pytest backend/tests/
export PYTHONPATH=""
echo "Backend tests passed."


# --- Stage 2: End-to-End API Tests ---
echo ""
echo "--- 3. Running end-to-end tests on live application ---"
if ! docker-compose ps | grep "Up" > /dev/null 2>&1; then
    echo "Application is not running for E2E tests. Please run './start.sh' first."
    exit 1
fi
echo "Application is running."
python backend/tests/run_tests.py


# --- Finish ---
deactivate
echo ""
echo "--- All stages of the test suite passed successfully! ---" 