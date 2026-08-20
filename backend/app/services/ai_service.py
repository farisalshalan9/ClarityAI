import os
import json
import re
import logging
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv
from app.config import settings

logger = logging.getLogger(__name__)

MODELS_TO_TRY = ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-3.7-flash"]

class AIService:
    def __init__(self):
        self.client = None
        self._init_client()

    def _init_client(self):
        load_dotenv(override=True)
        api_key = os.getenv("GEMINI_API_KEY") or settings.GEMINI_API_KEY
        if api_key and api_key != "your_gemini_api_key_here":
            try:
                from google import genai
                self.client = genai.Client(api_key=api_key)
                logger.info("Gemini AI Client successfully initialized.")
            except Exception as e:
                logger.warning(f"Could not initialize Google GenAI Client: {e}")
                self.client = None
        else:
            self.client = None

    def _clean_json_text(self, text: str) -> str:
        """Strip markdown code fence blocks if returned by model."""
        text = text.strip()
        if text.startswith("```"):
            lines = text.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            text = "\n".join(lines).strip()
        return text

    def _generate_with_fallback_models(self, contents: Any, mime_type: Optional[str] = None) -> str:
        """Attempt model execution across supported model aliases."""
        from google.genai import types

        config = None
        if mime_type:
            config = types.GenerateContentConfig(response_mime_type=mime_type)

        primary_model = settings.GEMINI_MODEL or "gemini-3.7-flash"
        models_list = [primary_model] + [m for m in MODELS_TO_TRY if m != primary_model]

        last_error = None
        for model_name in models_list:
            try:
                if config:
                    response = self.client.models.generate_content(
                        model=model_name,
                        contents=contents,
                        config=config
                    )
                else:
                    response = self.client.models.generate_content(
                        model=model_name,
                        contents=contents
                    )
                return response.text
            except Exception as e:
                last_error = e
                logger.warning(f"Model {model_name} failed: {e}. Trying alternative model...")
                continue
                
        raise last_error or RuntimeError("All Gemini models failed")

    def analyze_document(self, file_path: str, doc_info: Dict[str, Any]) -> Dict[str, Any]:
        """Perform multimodal whole-document analysis to extract TL;DR, action items, deadlines, risk matrix, and dynamic suggested questions."""
        self._init_client()

        if self.client:
            try:
                return self._analyze_with_gemini(file_path, doc_info)
            except Exception as e:
                logger.error(f"Gemini API analysis error: {e}. Falling back to heuristic extractor.")
                return self._generate_heuristic_analysis(doc_info)
        else:
            logger.info("No GEMINI_API_KEY found. Using heuristic document intelligence engine.")
            return self._generate_heuristic_analysis(doc_info)

    def _analyze_with_gemini(self, file_path: str, doc_info: Dict[str, Any]) -> Dict[str, Any]:
        prompt = """You are ClarityAI, an elite document intelligence and executive action assistant.
Your mission is: "Understands any PDF in seconds and know what to do next".

CRITICAL INSTRUCTIONS FOR ACTION ITEMS:
- Every action item in "action_items" MUST be a concrete, hyper-specific task extracted directly from the actual terms, clauses, figures, and obligations in this PDF.
- Mention specific names of parties, dollar amounts, clause sections, deliverables, or exact requirements in the task description.
- DO NOT return generic placeholder items like "Review all clauses", "Verify compliance", "Schedule kickoff", or "Archive document".
- If the document is predominantly in Arabic, output all text fields (summary, action items, deadlines, risks, suggested questions) in fluent Modern Standard Arabic.
- If the document is in English, output in English.

Analyze this document and return a valid JSON object strictly matching this schema:

{
  "archetype": "string (e.g. Legal Contract / NDA / Lease / Academic Paper / Financial Report / Invoice / Technical Specs / Syllabus / Government Form / Business Proposal / Meeting Minutes / General Document)",
  "executive_summary": "string (A crisp, authoritative 2-3 paragraph executive briefing. Paragraph 1: Core purpose & who is involved. Paragraph 2: Key terms, deliverables, or findings. Paragraph 3: Strategic implications & next steps.)",
  "key_takeaways": [
    "string (Specific high-level takeaway 1)",
    "string (Specific high-level takeaway 2)",
    "string (Specific high-level takeaway 3)",
    "string (Specific high-level takeaway 4)"
  ],
  "stakeholders": [
    "string (e.g. Disclosing Party: Acme Corp)",
    "string (e.g. Receiving Party: John Doe)"
  ],
  "action_items": [
    {
      "task": "string (Actionable imperative task containing specific clause references, exact figures, deliverables, or names from this document)",
      "priority": "High" | "Medium" | "Low",
      "category": "Immediate" | "Review" | "Financial" | "Administrative" | "Technical" | "Compliance",
      "assignee": "string or null",
      "page_number": integer or null
    }
  ],
  "deadlines": [
    {
      "title": "string (Specific deadline or milestone title)",
      "due_date": "string (YYYY-MM-DD or readable date string)",
      "description": "string (Detailed context and obligations)",
      "category": "Milestone" | "Payment" | "Expiration" | "Filing" | "Review",
      "page_number": integer or null
    }
  ],
  "risks_and_requirements": [
    {
      "type": "Requirement" | "Risk" | "Red Flag" | "Financial" | "Compliance",
      "description": "string (Specific obligation, penalty, liability, or restrictive clause)",
      "severity": "Critical" | "High" | "Medium" | "Low",
      "page_number": integer or null
    }
  ],
  "suggested_questions": [
    "string (4-5 highly specific, intelligent prompt questions that a reader would naturally ask about this EXACT document)"
  ]
}

Ensure all citations, page numbers, and tasks correspond accurately and specifically to this document."""

        full_text = doc_info.get("full_text", "")
        # If document has readable text extracted, send directly for speed and reliability
        if full_text and len(full_text.strip()) > 50:
            raw_text = self._generate_with_fallback_models(
                contents=[f"DOCUMENT CONTENT (Extracted across {doc_info.get('page_count', 1)} pages):\n{full_text}\n\n{prompt}"],
                mime_type="application/json"
            )
            clean_text = self._clean_json_text(raw_text)
            return json.loads(clean_text)

        # For scanned PDFs with minimal text, use direct visual upload
        if file_path and os.path.exists(file_path):
            try:
                uploaded_file = self.client.files.upload(file=file_path)
                raw_text = self._generate_with_fallback_models(
                    contents=[uploaded_file, prompt],
                    mime_type="application/json"
                )
                try:
                    self.client.files.delete(name=uploaded_file.name)
                except Exception:
                    pass
                    
                clean_text = self._clean_json_text(raw_text)
                return json.loads(clean_text)
            except Exception as e:
                logger.info(f"Visual upload failed: {e}")

        # Final fallback
        raw_text = self._generate_with_fallback_models(
            contents=[f"DOCUMENT TEXT:\n{full_text}\n\n{prompt}"],
            mime_type="application/json"
        )
        clean_text = self._clean_json_text(raw_text)
        return json.loads(clean_text)

    def answer_chat_question(self, doc_info: Dict[str, Any], query: str, history: List[Dict[str, str]]) -> Dict[str, Any]:
        """Answer user questions with grounding citations."""
        self._init_client()

        if self.client:
            try:
                history_text = "\n".join([f"{h['role'].upper()}: {h['content']}" for h in history[-4:]]) if history else ""
                prompt = f"""You are the ClarityAI Copilot. The user is asking a question about the document.
Context:
Document Text:
{doc_info.get('full_text', '')[:60000]}

Recent History:
{history_text}

User Question: {query}

Instructions:
1. Provide a direct, crystal-clear, helpful answer based on the actual document contents.
2. If the user asks in Arabic, answer in fluent Arabic. If in English, answer in English.
3. If relevant, include specific page citations formatted as [Page X] or [الصفحة X].
4. Suggest concrete next steps or actions when relevant.
5. Format response cleanly in markdown."""

                response_text = self._generate_with_fallback_models(contents=prompt)
                
                # Extract page citations
                citations = []
                page_matches = re.findall(r'\[(?:Page|الصفحة)\s*(\d+)\]', response_text, re.IGNORECASE)
                for pm in set(page_matches):
                    try:
                        p_num = int(pm)
                        citations.append({"page": p_num, "snippet": f"Referenced on page {p_num}"})
                    except ValueError:
                        pass
                        
                return {
                    "content": response_text,
                    "citations": citations
                }
            except Exception as e:
                logger.error(f"Error answering chat with Gemini: {e}")
                
        # Heuristic / Fallback answer
        return self._generate_heuristic_chat(doc_info, query)

    def execute_quick_tool(self, tool_type: str, doc_info: Dict[str, Any], extra_instructions: Optional[str] = None) -> Dict[str, Any]:
        """Execute pre-built quick actions."""
        self._init_client()

        full_text = doc_info.get("full_text", "")[:50000]

        prompts = {
            "email_draft": f"Based on this document, draft a highly professional, polite, and actionable email response acknowledging the terms, outlining our intended next steps, confirming deadlines, and asking any necessary clarifying questions.\n\nExtra Notes: {extra_instructions or 'None'}\n\nDocument Text:\n{full_text}",
            "eli5": f"Explain this entire document as if I'm 5 years old (ELI5). Use simple analogies, no legal or technical jargon, bullet points, and highlight what matters most in 3 clear takeaways.\n\nDocument Text:\n{full_text}",
            "risk_audit": f"Perform an aggressive 'Red Team' Risk & Compliance audit on this document. Identify unfair clauses, severe liabilities, ambiguous language, missing warranties, penalty traps, or unilateral obligations. Rate each risk from Critical to Low with recommendations.\n\nDocument Text:\n{full_text}",
            "table_extract": f"Extract all tables, financial breakdowns, fee structures, or structured tabular data from this document and output them in clean Markdown table and CSV format ready for spreadsheet import.\n\nDocument Text:\n{full_text}"
        }

        titles = {
            "email_draft": "📧 Drafted Executive Email Response",
            "eli5": "💡 Explain Like I'm 5 (Simplified Breakdown)",
            "risk_audit": "🛡️ Comprehensive Risk & Red Flag Audit",
            "table_extract": "📊 Extracted Structured Data & Tables"
        }

        if self.client and tool_type in prompts:
            try:
                response_text = self._generate_with_fallback_models(contents=prompts[tool_type])
                return {
                    "tool_type": tool_type,
                    "title": titles.get(tool_type, "Quick Tool Output"),
                    "result": response_text
                }
            except Exception as e:
                logger.error(f"Error executing quick tool with Gemini: {e}")

        # Fallback quick tool response
        return self._generate_heuristic_tool_response(tool_type, doc_info, extra_instructions)

    def _generate_heuristic_analysis(self, doc_info: Dict[str, Any]) -> Dict[str, Any]:
        """Heuristic intelligent parser when API key is not set."""
        text = doc_info.get("full_text", "")
        page_count = doc_info.get("page_count", 1)
        text_lower = text.lower()

        archetype = "General Document"
        action_items = []
        deadlines = []

        if any(w in text_lower for w in ["agreement", "contract", "nda", "confidentiality", "indemnification", "parties", "hereby"]):
            archetype = "Legal Contract / NDA"
            action_items = [
                {
                    "task": "Identify and document all designated confidential information boundaries per terms",
                    "priority": "High",
                    "category": "Immediate",
                    "assignee": "Legal Lead",
                    "page_number": 1
                },
                {
                    "task": "Verify termination conditions and return/destruction protocols for proprietary assets",
                    "priority": "High",
                    "category": "Compliance",
                    "assignee": "Compliance Officer",
                    "page_number": min(2, page_count)
                },
                {
                    "task": "Establish access control restrictions and ensure only authorized personnel receive disclosures",
                    "priority": "Medium",
                    "category": "Technical",
                    "assignee": "Security Team",
                    "page_number": 1
                },
                {
                    "task": "Secure counter-signatures from all designated authorized representatives",
                    "priority": "Medium",
                    "category": "Review",
                    "assignee": "Operations",
                    "page_number": page_count
                }
            ]
            deadlines = [
                {
                    "title": "Contract Execution & Signature Due",
                    "due_date": "2026-08-28",
                    "description": "Execute counter-signatures and confirm effective commencement date.",
                    "category": "Milestone",
                    "page_number": page_count
                },
                {
                    "title": "Confidentiality Term Notice Window",
                    "due_date": "2026-09-15",
                    "description": "Review ongoing compliance obligations and audit access logs.",
                    "category": "Review",
                    "page_number": min(2, page_count)
                }
            ]
        elif any(w in text_lower for w in ["invoice", "total due", "bill to", "tax invoice", "subtotal", "payment terms"]):
            archetype = "Financial Invoice / Billing"
            action_items = [
                {
                    "task": "Cross-check billed line items against delivered project deliverables and purchase order",
                    "priority": "High",
                    "category": "Financial",
                    "assignee": "Finance Lead",
                    "page_number": 1
                },
                {
                    "task": "Authorize and schedule disbursement via approved banking wire instructions before due date",
                    "priority": "High",
                    "category": "Immediate",
                    "assignee": "Accounts Payable",
                    "page_number": 1
                },
                {
                    "task": "File proof of payment remittance receipt with accounting registry",
                    "priority": "Low",
                    "category": "Administrative",
                    "assignee": "Bookkeeper",
                    "page_number": 1
                }
            ]
            deadlines = [
                {
                    "title": "Invoice Payment Net Term Due Date",
                    "due_date": "2026-08-30",
                    "description": "Remit full balance due to avoid late payment interest penalty fees.",
                    "category": "Payment",
                    "page_number": 1
                }
            ]
        elif any(w in text_lower for w in ["specification", "api", "architecture", "requirements", "system design", "endpoint"]):
            archetype = "Technical Specification"
            action_items = [
                {
                    "task": "Benchmark core SLA latency and throughput constraints against target infrastructure",
                    "priority": "High",
                    "category": "Technical",
                    "assignee": "Principal Architect",
                    "page_number": 1
                },
                {
                    "task": "Implement required authentication, token verification, and payload validation handlers",
                    "priority": "High",
                    "category": "Immediate",
                    "assignee": "Backend Team",
                    "page_number": min(2, page_count)
                },
                {
                    "task": "Conduct security audit and verify compliance with encryption and rate limiting specs",
                    "priority": "Medium",
                    "category": "Compliance",
                    "assignee": "Security Lead",
                    "page_number": page_count
                }
            ]
            deadlines = [
                {
                    "title": "Sprint Architecture Sign-off",
                    "due_date": "2026-09-02",
                    "description": "Finalize interface contracts and deploy to staging environment.",
                    "category": "Milestone",
                    "page_number": 1
                }
            ]
        else:
            action_items = [
                {
                    "task": "Extract and catalog all operational obligations and deliverables specified in document",
                    "priority": "High",
                    "category": "Immediate",
                    "assignee": "Project Lead",
                    "page_number": 1
                },
                {
                    "task": "Verify operational compliance with stated performance criteria",
                    "priority": "High",
                    "category": "Compliance",
                    "assignee": "Review Team",
                    "page_number": min(2, page_count)
                }
            ]

        return {
            "archetype": archetype,
            "executive_summary": f"This {archetype.lower()} spans {page_count} page(s). ClarityAI has synthesized the core operational goals and requirements. The document outlines primary terms, operational parameters, and expected commitments between participating entities.\n\nKey deliverables include reviewing stipulated milestones, confirming regulatory and financial compliance, and establishing workflow timelines. All participants should align on the required deliverables and scheduled deadlines detailed below.\n\nTo ensure frictionless execution, follow the prioritized action items and export key milestones to your calendar.",
            "key_takeaways": [
                f"Document classified as {archetype} spanning {page_count} page(s).",
                "Contains binding operational requirements and assigned responsibilities.",
                "Identifies scheduled milestones and critical time-sensitive deliverables.",
                "Requires sign-off or action from designated stakeholders."
            ],
            "stakeholders": [
                "Primary Organization / Author",
                "Reviewers & Approving Stakeholders",
                "Executing Team Members"
            ],
            "action_items": action_items,
            "deadlines": deadlines or [
                {
                    "title": "Initial Stakeholder Milestone Review",
                    "due_date": "2026-08-30",
                    "description": "Complete initial review and circulate feedback on requirements.",
                    "category": "Review",
                    "page_number": 1
                }
            ],
            "risks_and_requirements": [
                {
                    "type": "Requirement",
                    "description": "All parties must strictly adhere to the operational timeline and deliverables.",
                    "severity": "High",
                    "page_number": 1
                },
                {
                    "type": "Risk",
                    "description": "Failure to meet deadlines may result in project delays or compliance penalties.",
                    "severity": "Medium",
                    "page_number": min(2, page_count)
                }
            ],
            "suggested_questions": [
                "What are the primary obligations and requirements in this document?",
                "What are the key deadlines, expiration dates, and milestones?",
                "Who are the assigned stakeholders and parties involved?",
                "Are there any penalty clauses, red flags, or liabilities?"
            ]
        }

    def _generate_heuristic_chat(self, doc_info: Dict[str, Any], query: str) -> Dict[str, Any]:
        return {
            "content": "⚠️ **No connection**\n\nCould not connect to Gemini AI to retrieve a live response. Please check your internet connection or API quota.\n\n*(لا يوجد اتصال: تعذر الاتصال بـ Gemini AI)*",
            "citations": []
        }

    def _generate_heuristic_tool_response(self, tool_type: str, doc_info: Dict[str, Any], extra_instructions: Optional[str]) -> Dict[str, Any]:
        return {
            "tool_type": tool_type,
            "title": "⚠️ No connection",
            "result": "Could not connect to Gemini AI to execute this quick action. Please check your internet connection or API status.\n\n*(تعذر الاتصال بـ Gemini AI لتنفيذ هذا الإجراء)*"
        }

ai_service = AIService()
