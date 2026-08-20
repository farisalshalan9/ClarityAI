import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine, Base
from app.routers import auth, documents, analysis, chat, share

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ClarityAI API",
    description="Intelligent PDF Action Assistant Backend API",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(analysis.router)
app.include_router(chat.router)
app.include_router(share.router)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app": "ClarityAI",
        "version": "1.0.0",
        "model": settings.GEMINI_MODEL,
        "has_api_key": bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your_gemini_api_key_here")
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
