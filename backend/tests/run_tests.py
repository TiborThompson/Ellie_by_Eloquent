import requests
import sys
import os
import uuid

BASE_URL = "http://localhost:8000"
test_session_id = None
test_auth_token = None
# Generate a unique email for each test run to ensure isolation
test_user_email = f"testuser_{uuid.uuid4()}@example.com"
test_user_password = "a_Strong_Password123!"

def run_test(test_function):
    """Decorator to run a test and print its status."""
    def wrapper():
        print(f"▶️  Running test: {test_function.__name__}...")
        try:
            test_function()
            print(f"✅ PASS: {test_function.__name__}")
            return True
        except AssertionError as e:
            print(f"❌ FAIL: {test_function.__name__}")
            print(f"   Reason: {e}")
            return False
    return wrapper

@run_test
def test_health_check():
    """Tests if the backend health check endpoint is responsive."""
    response = requests.get(f"{BASE_URL}/health")
    assert response.status_code == 200, f"Expected status 200, got {response.status_code}"
    assert response.json() == {"status": "healthy"}, f"Unexpected response body: {response.json()}"

@run_test
def test_create_anonymous_session():
    """Tests the creation of a new anonymous chat session."""
    global test_session_id
    response = requests.post(f"{BASE_URL}/api/session/create")
    assert response.status_code == 200, f"Expected status 200, got {response.status_code}"
    data = response.json()
    assert "session_id" in data, "Response JSON must contain a 'session_id'"
    assert data["session_info"]["is_anonymous"] is True, "Session should be anonymous"
    test_session_id = data["session_id"]
    print(f"   -> Created session: {test_session_id}")

@run_test
def test_user_registration():
    """Tests if a new user can be registered successfully."""
    payload = {
        "email": test_user_email,
        "password": test_user_password
    }
    response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
    
    assert response.status_code == 200, f"Expected status 200, got {response.status_code} with body {response.text}"
    data = response.json()
    assert "access_token" in data, "Response must contain an access_token"
    assert data["user"]["email"] == test_user_email, "Registered email does not match"
    print(f"   -> Registered user: {test_user_email}")

@run_test
def test_user_login():
    """Tests if a registered user can log in."""
    global test_auth_token
    payload = {
        "email": test_user_email,
        "password": test_user_password
    }
    response = requests.post(f"{BASE_URL}/api/auth/login", json=payload)

    assert response.status_code == 200, f"Expected status 200, got {response.status_code} with body {response.text}"
    data = response.json()
    assert "access_token" in data, "Response must contain an access_token"
    test_auth_token = data["access_token"]
    print(f"   -> Logged in successfully and received auth token.")

@run_test
def test_authenticated_chat():
    """Tests the chat endpoint as an authenticated user."""
    global test_auth_token
    assert test_auth_token is not None, "Cannot run authenticated chat test without an auth token"

    headers = {
        "Authorization": f"Bearer {test_auth_token}"
    }
    # Note: For authenticated users, the session is managed on the backend,
    # so we don't need to pass a session_id.
    payload = {
        "message": "What are the fees for international transfers?"
    }
    response = requests.post(f"{BASE_URL}/api/chat", json=payload, headers=headers)

    assert response.status_code == 200, f"Expected status 200, got {response.status_code} with body {response.text}"
    data = response.json()
    assert "response" in data, "Response JSON must contain a 'response' field"
    # A more robust test: check that the response is substantial, not that it contains a specific word.
    assert len(data["response"]) > 20, "Authenticated chatbot response seems too short"
    print(f"   -> Authenticated user chatted successfully.")

@run_test
def test_rag_chat_endpoint():
    """Tests the core RAG chatbot functionality for an anonymous user."""
    global test_session_id
    assert test_session_id is not None, "Cannot run chat test without a session ID"
    
    payload = {
        "message": "How do I verify my account?",
        "session_id": test_session_id
    }
    response = requests.post(f"{BASE_URL}/api/chat", json=payload)
    
    assert response.status_code == 200, f"Expected status 200, got {response.status_code}"
    data = response.json()
    assert "response" in data, "Response JSON must contain a 'response' field"
    assert len(data["response"]) > 20, "Chatbot response seems too short"
    assert "verify" in data["response"].lower(), "Chatbot response should contain the word 'verify'"
    print(f"   -> Chatbot responded successfully.")

def main():
    print("--- 🧪 Running Automated E2E Tests ---")
    
    # List of tests to run in sequence
    tests = [
        test_health_check,
        # Anonymous User Flow
        test_create_anonymous_session,
        test_rag_chat_endpoint,
        # Authenticated User Flow
        test_user_registration,
        test_user_login,
        test_authenticated_chat
    ]
    
    results = [test() for test in tests]
    
    print("\n--- 📊 Test Summary ---")
    passed = sum(1 for r in results if r)
    failed = len(results) - passed
    
    print(f"Total tests: {len(results)}, Passed: {passed}, Failed: {failed}")
    
    if failed > 0:
        print("\n🔥 Some tests failed. Please review the output above.")
        sys.exit(1)
    else:
        print("\n🎉 All tests passed successfully!")
        sys.exit(0)

if __name__ == "__main__":
    main() 