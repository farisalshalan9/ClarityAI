from app.services.ai_service import ai_service

def test_heuristic_analysis():
    sample_doc_info = {
        "page_count": 3,
        "full_text": "Non-Disclosure Agreement (NDA) between Acme Corp and John Doe. In accordance with terms, confidentiality must be preserved."
    }
    result = ai_service.analyze_document("dummy_path", sample_doc_info)
    assert "archetype" in result
    assert "executive_summary" in result
    assert "action_items" in result
    assert len(result["action_items"]) > 0
    assert "deadlines" in result
    assert "risks_and_requirements" in result

def test_quick_tools():
    sample_doc_info = {
        "page_count": 2,
        "full_text": "Service Level Agreement (SLA). Maintenance every Tuesday. Payment due net 30."
    }
    eli5 = ai_service.execute_quick_tool("eli5", sample_doc_info)
    assert eli5["tool_type"] == "eli5"
    assert len(eli5["result"]) > 20

    email = ai_service.execute_quick_tool("email_draft", sample_doc_info)
    assert email["tool_type"] == "email_draft"
    assert "Subject:" in email["result"] or "Dear" in email["result"]
