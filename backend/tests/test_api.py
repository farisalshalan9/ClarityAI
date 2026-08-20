from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "ClarityAI"
    assert data["status"] == "healthy"

def test_auth_workflow():
    import uuid
    rand_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    reg_resp = client.post("/api/auth/register", json={
        "email": rand_email,
        "password": "Password123!",
        "full_name": "Test Runner"
    })
    assert reg_resp.status_code == 200
    token_data = reg_resp.json()
    assert "access_token" in token_data
    token = token_data["access_token"]

    # Test me endpoint
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == rand_email
