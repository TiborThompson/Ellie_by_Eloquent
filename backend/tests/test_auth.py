from backend.app.core.auth import verify_password, hash_password

def test_password_hashing():
    """
    Tests that a password is correctly hashed and can be verified.
    """
    password = "a_secure_password123"
    
    # Hash the password
    hashed_password = hash_password(password)
    
    # 1. Test that the hash is not the same as the original password
    assert password != hashed_password
    
    # 2. Test that the verification works with the correct password
    assert verify_password(password, hashed_password) is True
    
    # 3. Test that the verification fails with an incorrect password
    assert verify_password("wrong_password", hashed_password) is False

def test_verify_password_edge_cases():
    """
    Tests edge cases for password verification.
    """
    password = "a_secure_password123"
    hashed_password = hash_password(password)
    
    # Test with an empty string password
    assert verify_password("", hashed_password) is False 