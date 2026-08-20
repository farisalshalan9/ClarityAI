from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Document, ChatMessage
from app.schemas import (
    ChatMessageRequest, ChatMessageResponse, 
    QuickToolRequest, QuickToolResponse
)
from app.security import get_current_user
from app.services.pdf_service import pdf_service
from app.services.ai_service import ai_service

router = APIRouter(prefix="/api/documents", tags=["Chat & Quick Tools"])

@router.get("/{document_id}/chat", response_model=List[ChatMessageResponse])
def get_chat_history(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    messages = db.query(ChatMessage).filter(ChatMessage.document_id == document_id).order_by(ChatMessage.created_at.asc()).all()
    return messages

@router.post("/{document_id}/chat", response_model=ChatMessageResponse)
def send_chat_message(
    document_id: str,
    msg_in: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    # Save user message
    user_msg = ChatMessage(
        document_id=document_id,
        user_id=current_user.id,
        role="user",
        content=msg_in.content,
        citations=[]
    )
    db.add(user_msg)
    db.commit()

    # Retrieve history
    history_records = db.query(ChatMessage).filter(ChatMessage.document_id == document_id).order_by(ChatMessage.created_at.asc()).all()
    history = [{"role": m.role, "content": m.content} for m in history_records]

    # Extract document context and generate answer
    doc_info = pdf_service.extract_document_info(doc.file_path)
    ai_resp = ai_service.answer_chat_question(doc_info, msg_in.content, history)

    # Save assistant message
    bot_msg = ChatMessage(
        document_id=document_id,
        user_id=None,
        role="assistant",
        content=ai_resp["content"],
        citations=ai_resp.get("citations", [])
    )
    db.add(bot_msg)
    db.commit()
    db.refresh(bot_msg)

    return bot_msg

@router.post("/{document_id}/quick-tool", response_model=QuickToolResponse)
def execute_quick_tool_action(
    document_id: str,
    tool_req: QuickToolRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    doc_info = pdf_service.extract_document_info(doc.file_path)
    result = ai_service.execute_quick_tool(tool_req.tool_type, doc_info, tool_req.extra_instructions)
    return result
