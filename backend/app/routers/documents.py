import os
import uuid
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User, Document, DocumentAnalysis, ActionItem, Deadline
from app.schemas import DocumentResponse, DocumentDetailResponse
from app.security import get_current_user
from app.services.pdf_service import pdf_service
from app.services.ai_service import ai_service

router = APIRouter(prefix="/api/documents", tags=["Documents"])

@router.post("/upload", response_model=DocumentDetailResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported."
        )

    # Generate unique storage filename
    file_id = str(uuid.uuid4())
    clean_filename = os.path.basename(file.filename)
    stored_filename = f"{file_id}_{clean_filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, stored_filename)

    # Save to disk
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    file_size = os.path.getsize(file_path)

    # Extract PDF metadata & pages using PyMuPDF
    try:
        doc_info = pdf_service.extract_document_info(file_path)
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not parse PDF: {str(e)}"
        )

    # Create document record
    title = clean_filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").title()
    document = Document(
        id=file_id,
        user_id=current_user.id,
        title=title,
        filename=clean_filename,
        file_path=file_path,
        file_size=file_size,
        page_count=doc_info["page_count"],
        archetype="General Document",
        status="ready"
    )
    db.add(document)
    db.commit()

    # Perform AI Analysis (Gemini Multimodal / Heuristic fallback)
    try:
        analysis_data = ai_service.analyze_document(file_path, doc_info)
        document.archetype = analysis_data.get("archetype", "General Document")
        
        # Save analysis
        analysis_record = DocumentAnalysis(
            document_id=document.id,
            executive_summary=analysis_data.get("executive_summary", ""),
            key_takeaways=analysis_data.get("key_takeaways", []),
            stakeholders=analysis_data.get("stakeholders", []),
            risks_and_requirements=analysis_data.get("risks_and_requirements", []),
            suggested_questions=analysis_data.get("suggested_questions", []),
            raw_response=analysis_data
        )
        db.add(analysis_record)

        # Save action items
        for idx, item in enumerate(analysis_data.get("action_items", [])):
            action = ActionItem(
                document_id=document.id,
                task=item.get("task", ""),
                priority=item.get("priority", "Medium"),
                category=item.get("category", "General"),
                assignee=item.get("assignee"),
                page_number=item.get("page_number"),
                order_idx=idx
            )
            db.add(action)

        # Save deadlines
        for d in analysis_data.get("deadlines", []):
            deadline = Deadline(
                document_id=document.id,
                title=d.get("title", ""),
                due_date=d.get("due_date", ""),
                description=d.get("description", ""),
                page_number=d.get("page_number"),
                category=d.get("category", "Deadline")
            )
            db.add(deadline)

        db.commit()
        db.refresh(document)
    except Exception as e:
        document.status = "error"
        document.error_message = str(e)
        db.commit()
        db.refresh(document)

    return document

@router.get("/", response_model=List[DocumentResponse])
def get_user_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    docs = db.query(Document).filter(Document.user_id == current_user.id).order_by(Document.created_at.desc()).all()
    results = []
    for d in docs:
        total_actions = len(d.action_items)
        completed_actions = sum(1 for a in d.action_items if a.is_completed)
        doc_dict = {
            "id": d.id,
            "title": d.title,
            "filename": d.filename,
            "file_size": d.file_size,
            "page_count": d.page_count,
            "archetype": d.archetype,
            "status": d.status,
            "error_message": d.error_message,
            "is_public": d.is_public,
            "share_token": d.share_token,
            "created_at": d.created_at,
            "updated_at": d.updated_at,
            "action_items_total": total_actions,
            "action_items_completed": completed_actions
        }
        results.append(doc_dict)
    return results

@router.get("/{document_id}", response_model=DocumentDetailResponse)
def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return doc

@router.get("/{document_id}/file")
def get_raw_pdf_file(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PDF file not found")
    
    with open(doc.file_path, "rb") as f:
        content = f.read()
        
    return Response(
        content=content,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{doc.filename}"'}
    )

@router.get("/{document_id}/page/{page_number}")
def get_rendered_page(
    document_id: str,
    page_number: int,
    zoom: float = 1.5,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    
    try:
        img_bytes = pdf_service.render_page_image(doc.file_path, page_number, zoom=zoom)
        return Response(content=img_bytes, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    
    # Remove file from disk
    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass
            
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully"}
