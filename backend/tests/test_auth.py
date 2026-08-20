from app.security import get_password_hash, verify_password, create_access_token
from jose import jwt
from app.config import settings

def test_password_hashing():
    raw = "SecurePassword123!"
    hashed = get_password_hash(raw)
    assert hashed != raw
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_jwt_token_generation_and_decode():
    payload = {"sub": "user_12345", "email": "test@example.com"}
    token = create_access_token(payload)
    assert isinstance(token, str)
    
    decoded = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    assert decoded["sub"] == "user_12345"
    assert decoded["email"] == "test@example.com"
    assert "exp" in decoded
