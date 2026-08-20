# ClarityAI — Intelligent PDF Action Assistant

> **"Understand any PDF in seconds and immediately know what to do next."**
> 
> **"افهم أي مستند PDF في ثوانٍ وحدد خطوتك التالية فوراً."**

ClarityAI is an executive-grade AI copilot and split-screen document intelligence workspace that turns dense, complex, or lengthy PDFs (contracts, technical specifications, financial invoices, academic papers, compliance documents) into clear, structured, and actionable roadmaps.

---

## 🌟 Key Capabilities

1. **Split-Screen Workspace**: High-resolution, page-by-page PDF viewer on the left; structured Action Intelligence Hub on the right.
2. **Universal Document Intelligence**: Automatically identifies document archetype (Legal Contract / NDA, Technical Spec, Invoice, Academic Paper, Policy, etc.) and dynamically adapts its extraction strategy.
3. **Adaptive Action Items & Interactive Checklist**: Concrete, hyper-specific tasks extracted directly from the PDF's terms and figures with priority tags (High, Medium, Low), one-click completion toggling, and page citation jumps.
4. **Deadlines & Milestones with Calendar Export**: Chronological timeline of all identified due dates, review windows, and milestones with one-click **`.ics` Calendar Export** (Apple Calendar, Google Calendar, Outlook).
5. **Requirements & Risk Matrix**: Aggressive red-flag and vulnerability audit detailing critical constraints, liabilities, and compliance obligations.
6. **Interactive Grounded Copilot**: Multi-turn chat assistant grounded in the document with clickable `[Page X]` citations and dynamic, document-tailored suggested prompt chips.
7. **Full Arabic Language (العربية) Support**: Seamless bilingual toggle (English / العربية) with native Right-to-Left (RTL) layout, Tajawal typography, and Arabic AI synthesis.
8. **One-Click Quick Actions**:
   - 📧 **Draft Email Reply**: Generates a professional reply acknowledging obligations, confirming next steps, and asking key questions.
   - 💡 **Explain Like I'm 5 (ELI5)**: Strips away jargon and explains the document in simple analogies.
   - 🛡️ **Risk & Red Flag Audit**: Identifies unfair clauses, hidden liabilities, and ambiguous language.
   - 📊 **Extract Tables to CSV**: Extracts financial breakdowns, pricing matrices, or schedules into spreadsheet-ready format.
9. **Multi-User JWT Authentication & Sharing**: Secure user registration, encrypted passwords, JWT tokens, and one-click shareable read-only preview links.

---

## 🏗️ System Architecture

```
clarity-ai/
├── backend/
│   ├── app/
│   │   ├── config.py              # Environment configuration & settings
│   │   ├── database.py            # SQLAlchemy engine & SQLite/PostgreSQL session
│   │   ├── models.py              # Database models (User, Document, Analysis, ActionItem, Deadline, Chat)
│   │   ├── schemas.py             # Pydantic v2 validation models
│   │   ├── security.py            # Password hashing & JWT token handling
│   │   ├── services/
│   │   │   ├── ai_service.py      # Google GenAI (Gemini 3.7 Flash) multimodal & heuristic engine
│   │   │   ├── pdf_service.py     # PyMuPDF extraction, rendering, and citations
│   │   │   ├── calendar_service.py# Standard .ics iCalendar file generator
│   │   │   └── supabase_service.py# Optional cloud Supabase auth integration
│   │   └── routers/
│   │       ├── auth.py            # /api/auth (register, login, me)
│   │       ├── documents.py       # /api/documents (upload, view, page render)
│   │       ├── analysis.py        # /api/documents/{id}/analysis & action toggling
│   │       ├── chat.py            # /api/documents/{id}/chat & quick tools
│   │       └── share.py           # /api/share (public read-only links)
│   ├── main.py                    # FastAPI application entrypoint
│   ├── requirements.txt           # Python dependencies
│   └── tests/                     # Automated pytest suite
│
├── frontend/
│   ├── src/
│   │   ├── components/            # PDFViewer, ActionChecklist, DeadlinesTimeline, ChatCopilot, etc.
│   │   ├── pages/                 # AuthPage, DashboardPage, WorkspacePage, SharedDocumentPage
│   │   ├── context/               # AuthContext, LanguageContext (EN / AR with RTL)
│   │   └── api/                   # Typed Axios API client
│   ├── package.json
│   └── vite.config.ts
```

---

## 🚀 Quick Start Guide

### 1. Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

# Configure Gemini API Key in backend/.env:
# GEMINI_API_KEY=your_gemini_api_key_here
# GEMINI_MODEL=gemini-3.7-flash

# Run backend server
python main.py
```
Backend runs on `http://127.0.0.1:8000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

### 3. Demo Login
When opening the web app, click **"Explore Instant Demo Account"** or **"دخول تجريبي فوري"** to explore all features immediately with pre-configured demo credentials.

---

## 🧪 Testing

Run backend tests:
```bash
cd backend
.\venv\Scripts\pytest.exe
```

Run frontend build verification:
```bash
cd frontend
npm run build
```

---

## 📄 License
MIT License. Open source and ready for production deployment.
