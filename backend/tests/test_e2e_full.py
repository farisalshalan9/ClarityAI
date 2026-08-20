import os
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_full_clarity_ai_workflow():
    # 1. Register user
    email = "executive@example.com"
    reg_resp = client.post("/api/auth/register", json={
        "email": email,
        "password": "ExecutivePassword123!",
        "full_name": "Dr. Eleanor Vance"
    })
    if reg_resp.status_code == 400: # already exists
        login_resp = client.post("/api/auth/login", json={
            "email": email,
            "password": "ExecutivePassword123!"
        })
        token = login_resp.json()["access_token"]
    else:
        assert reg_resp.status_code == 200
        token = reg_resp.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Upload sample NDA PDF
    sample_pdf_path = os.path.join(os.path.dirname(__file__), "..", "samples", "Sample_NDA_Contract.pdf")
    assert os.path.exists(sample_pdf_path), f"Sample PDF missing at {sample_pdf_path}"

    with open(sample_pdf_path, "rb") as f:
        upload_resp = client.post(
            "/api/documents/upload",
            files={"file": ("Sample_NDA_Contract.pdf", f, "application/pdf")},
            headers=headers
        )
    assert upload_resp.status_code == 200
    doc_data = upload_resp.json()
    doc_id = doc_data["id"]
    assert doc_data["page_count"] == 2
    assert len(doc_data["action_items"]) > 0
    assert len(doc_data["deadlines"]) > 0

    # 3. Test Action Toggle
    first_action = doc_data["action_items"][0]
    patch_resp = client.patch(
        f"/api/documents/{doc_id}/actions/{first_action['id']}",
        json={"is_completed": True},
        headers=headers
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["is_completed"] is True

    # 4. Test Calendar Export
    cal_resp = client.get(f"/api/documents/{doc_id}/deadlines/calendar.ics", headers=headers)
    assert cal_resp.status_code == 200
    assert "BEGIN:VCALENDAR" in cal_resp.text

    # 5. Test Chat Copilot
    chat_resp = client.post(
        f"/api/documents/{doc_id}/chat",
        json={"content": "What is the penalty for breaching confidentiality?"},
        headers=headers
    )
    assert chat_resp.status_code == 200
    chat_data = chat_resp.json()
    assert chat_data["role"] == "assistant"
    assert len(chat_data["content"]) > 10

    # 6. Test Quick Tool
    tool_resp = client.post(
        f"/api/documents/{doc_id}/quick-tool",
        json={"tool_type": "email_draft"},
        headers=headers
    )
    assert tool_resp.status_code == 200
    assert "email_draft" in tool_resp.json()["tool_type"]

    # 7. Test Sharing Link
    share_resp = client.patch(
        f"/api/documents/{doc_id}/share",
        json={"is_public": True},
        headers=headers
    )
    assert share_resp.status_code == 200
    share_token = share_resp.json()["share_token"]

    # 8. Test Public Shared View (without auth header)
    public_view_resp = client.get(f"/api/share/{share_token}")
    assert public_view_resp.status_code == 200
    assert public_view_resp.json()["id"] == doc_id
