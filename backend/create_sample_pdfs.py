"""Utility script to generate realistic sample test PDFs for ClarityAI demonstration."""
import os
import pymupdf as fitz

def generate_sample_nda(output_path: str):
    doc = fitz.open()
    
    # Page 1
    page1 = doc.new_page()
    p1_text = """MUTUAL NON-DISCLOSURE AND CONFIDENTIALITY AGREEMENT

This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of August 19, 2026 ("Effective Date"), by and between:
1. NovaTech Solutions Inc. ("Disclosing Party"), a Delaware Corporation, and
2. Apex Digital Enterprises ("Receiving Party"), a California Corporation.

RECITALS
WHEREAS, the parties wish to explore a potential strategic joint venture concerning multimodal artificial intelligence and enterprise data processing; and
WHEREAS, in connection with such discussions, either party may disclose confidential and proprietary information to the other.

1. DEFINITIONS AND SCOPE
"Confidential Information" means all non-public, confidential, or proprietary information, including but not limited to trade secrets, source code, neural network model weights, product roadmaps, customer lists, and financial projections.

2. OBLIGATIONS OF RECEIVING PARTY
The Receiving Party agrees:
(a) To maintain the strict confidentiality of the Disclosing Party's Confidential Information;
(b) Not to disclose any Confidential Information to any third party without prior written consent;
(c) To restrict access to its employees, contractors, and legal counsel on a strict "need-to-know" basis.

3. EXCLUSIONS
Confidential Information does not include information that: (i) is or becomes publicly known through no breach of this Agreement; (ii) was already in the rightful possession of Receiving Party prior to disclosure.
"""
    rect1 = fitz.Rect(50, 50, 550, 750)
    page1.insert_textbox(rect1, p1_text, fontsize=10, fontname="helv")
    
    # Page 2
    page2 = doc.new_page()
    p2_text = """4. REMEDIES AND LIQUIDATED DAMAGES
(a) The parties acknowledge that any unauthorized disclosure or breach of Section 2 will cause irreparable harm.
(b) Liquidated Damages: In the event of a willful or material breach of confidentiality, the breaching party shall be liable for liquidated damages in the amount of $250,000 USD per incident, in addition to reasonable attorney fees and injunctive relief.

5. KEY MILESTONES AND DATES
- Effective Date: August 19, 2026
- Initial Information Exchange Deadline: August 28, 2026
- Technical Feasibility Review: September 15, 2026
- Agreement Expiration Date: August 19, 2028 (2-year term)

6. GOVERNING LAW AND JURISDICTION
This Agreement shall be governed by and construed in accordance with the laws of the State of California, without regard to conflicts of law principles.

7. SIGNATURES AND EXECUTION
All authorized signatories must execute this Agreement prior to August 25, 2026.

IN WITNESS WHEREOF, the parties hereto have caused this Agreement to be executed by their duly authorized representatives.

NOVATECH SOLUTIONS INC.                    APEX DIGITAL ENTERPRISES
By: ___________________________            By: ___________________________
Name: Dr. Eleanor Vance                    Name: Marcus Sterling
Title: Chief Executive Officer             Title: Managing Director
Date: August 19, 2026                      Date: August 19, 2026
"""
    rect2 = fitz.Rect(50, 50, 550, 750)
    page2.insert_textbox(rect2, p2_text, fontsize=10, fontname="helv")
    
    doc.save(output_path)
    doc.close()
    print(f"Created sample NDA at {output_path}")

def generate_sample_specs(output_path: str):
    doc = fitz.open()
    
    # Page 1
    page1 = doc.new_page()
    p1_text = """PRODUCT REQUIREMENTS & TECHNICAL SPECIFICATION: NEXUS API v3.0

Document Status: Approved for Development
Author: Engineering Architecture Team
Target Release: Q4 2026

1. EXECUTIVE SUMMARY
Nexus API v3.0 is a high-throughput multimodal ingestion pipeline designed to process high-resolution enterprise documents, OCR streams, and real-time structured data extraction with sub-500ms latency.

2. CORE SYSTEM ARCHITECTURE & REQUIREMENTS
- Requirement 1 (R1): Must support asynchronous batch processing of up to 10,000 PDF pages per minute.
- Requirement 2 (R2): Authentication must utilize OAuth2 + JWT tokens with RS256 signing and 1-hour expiration.
- Requirement 3 (R3): All customer documents at rest must be encrypted with AES-256-GCM.
- Requirement 4 (R4): 99.99% service level agreement (SLA) uptime across multi-region deployment.

3. STAKEHOLDER RESPONSIBILITIES
- Backend Team: Implement FastAPI microservices and vector indexing by September 10, 2026.
- Security Audit Team: Perform penetration testing and ISO 27001 compliance audit by September 25, 2026.
- QA Team: Run load tests simulating 50,000 concurrent requests by October 5, 2026.
"""
    rect1 = fitz.Rect(50, 50, 550, 750)
    page1.insert_textbox(rect1, p1_text, fontsize=10, fontname="helv")
    
    # Page 2
    page2 = doc.new_page()
    p2_text = """4. RISK & VULNERABILITY ANALYSIS
- Critical Risk (C1): Third-party OCR parser rate-limiting could throttle peak ingestion volume. Fallback engine required.
- High Risk (H1): Memory leaks in PDF rendering subprocesses under high concurrency. Must implement process isolation.
- Compliance Risk (M1): GDPR right-to-be-forgotten requires automated hard-deletion across all database replicas within 72 hours.

5. KEY MILESTONES & SPRINT TIMELINE
- Sprint 1 Architecture Freeze: August 30, 2026
- Sprint 2 Alpha Internal Release: September 18, 2026
- Security Audit & Pen-Test Completion: September 30, 2026
- Production Go-Live Launch: October 15, 2026

6. APPROVAL & SIGN-OFF
Chief Technology Officer: Signed (David Chen) - August 18, 2026
Head of Security: Signed (Rachel Adams) - August 19, 2026
"""
    rect2 = fitz.Rect(50, 50, 550, 750)
    page2.insert_textbox(rect2, p2_text, fontsize=10, fontname="helv")
    
    doc.save(output_path)
    doc.close()
    print(f"Created sample Specs at {output_path}")

if __name__ == "__main__":
    samples_dir = os.path.join(os.path.dirname(__file__), "samples")
    os.makedirs(samples_dir, exist_ok=True)
    generate_sample_nda(os.path.join(samples_dir, "Sample_NDA_Contract.pdf"))
    generate_sample_specs(os.path.join(samples_dir, "Sample_Nexus_Technical_Specs.pdf"))
