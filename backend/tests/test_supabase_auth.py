import unittest.mock as mock
import pytest
from fastapi.testclient import TestClient
from main import app
from app.config import settings
from app.services.supabase_service import SupabaseAuthService

client = TestClient(app)

def test_supabase_service_is_enabled():
    svc = SupabaseAuthService()
    # Default is disabled when empty
    with mock.patch.object(settings, "SUPABASE_URL", ""):
        assert svc.is_enabled() is False

    with mock.patch.object(settings, "SUPABASE_URL", "https://xyzcompany.supabase.co"), \
         mock.patch.object(settings, "SUPABASE_KEY", "mock_anon_key"):
        assert svc.is_enabled() is True

def test_supabase_signup_mock():
    svc = SupabaseAuthService()
    mock_response = mock.MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "access_token": "mock_sb_jwt_token_123",
        "token_type": "bearer",
        "user": {
            "id": "sb_user_uuid_123",
            "email": "supabase_user@example.com",
            "user_metadata": {"full_name": "Supabase User"}
        }
    }

    with mock.patch.object(settings, "SUPABASE_URL", "https://xyzcompany.supabase.co"), \
         mock.patch.object(settings, "SUPABASE_KEY", "mock_anon_key"), \
         mock.patch("httpx.Client.post", return_value=mock_response):
        res = svc.signup("supabase_user@example.com", "SecurePass123!", "Supabase User")
        assert res["user_id"] == "sb_user_uuid_123"
        assert res["email"] == "supabase_user@example.com"
        assert res["access_token"] == "mock_sb_jwt_token_123"

def test_supabase_login_mock():
    svc = SupabaseAuthService()
    mock_response = mock.MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "access_token": "mock_sb_jwt_token_456",
        "token_type": "bearer",
        "user": {
            "id": "sb_user_uuid_456",
            "email": "supabase_login@example.com",
            "user_metadata": {"full_name": "Logged In User"}
        }
    }

    with mock.patch.object(settings, "SUPABASE_URL", "https://xyzcompany.supabase.co"), \
         mock.patch.object(settings, "SUPABASE_KEY", "mock_anon_key"), \
         mock.patch("httpx.Client.post", return_value=mock_response):
        res = svc.login("supabase_login@example.com", "SecurePass123!")
        assert res["user_id"] == "sb_user_uuid_456"
        assert res["access_token"] == "mock_sb_jwt_token_456"

def test_supabase_auth_endpoint_registration():
    mock_response = mock.MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "access_token": "mock_sb_jwt_register_789",
        "token_type": "bearer",
        "user": {
            "id": "sb_user_uuid_789",
            "email": "registered_sb@example.com",
            "user_metadata": {"full_name": "Registered SB"}
        }
    }

    with mock.patch.object(settings, "SUPABASE_URL", "https://xyzcompany.supabase.co"), \
         mock.patch.object(settings, "SUPABASE_KEY", "mock_anon_key"), \
         mock.patch.object(settings, "USE_SUPABASE_AUTH", True), \
         mock.patch("httpx.Client.post", return_value=mock_response):
        
        reg_res = client.post("/api/auth/register", json={
            "email": "registered_sb@example.com",
            "password": "Password123!",
            "full_name": "Registered SB"
        })
        assert reg_res.status_code == 200
        data = reg_res.json()
        assert data["access_token"] == "mock_sb_jwt_register_789"
        assert data["user"]["email"] == "registered_sb@example.com"
