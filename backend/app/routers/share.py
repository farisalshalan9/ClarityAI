import os
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Document, Deadline
from app.schemas import DocumentDetailResponse, ShareStatusUpdate
from app.security import get_current_user
from app.services.pdf_service import pdf_service
from app.services.calendar_service import calendar_service

router = APIRouter(tags=["Sharing"])

@router.patch("/api/documents/{document_id}/share")
def update_share_settings(
    document_id: str,
    share_in: ShareStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    doc.is_public = share_in.is_public
    db.commit()
    db.refresh(doc)
    return {
        "is_public": doc.is_public,
        "share_token": doc.share_token,
        "share_url": f"/share/{doc.share_token}"
    }

@router.get("/api/share/{share_token}", response_model=DocumentDetailResponse)
def get_shared_document(
    share_token: str,
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.share_token == share_token, Document.is_public == True).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shared document not found or access is disabled")
    return doc

@router.get("/api/share/{share_token}/file")
def get_shared_pdf_file(
    share_token: str,
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.share_token == share_token, Document.is_public == True).first()
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PDF file not found")
    
    with open(doc.file_path, "rb") as f:
        content = f.read()
        
    return Response(
        content=content,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{doc.filename}"'}
    )

@router.get("/api/share/{share_token}/page/{page_number}")
def get_shared_rendered_page(
    share_token: str,
    page_number: int,
    zoom: float = 1.5,
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.share_token == share_token, Document.is_public == True).first()
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    
    try:
        img_bytes = pdf_service.render_page_image(doc.file_path, page_number, zoom=zoom)
        return Response(content=img_bytes, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
