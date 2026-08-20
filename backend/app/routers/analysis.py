from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Document, DocumentAnalysis, ActionItem, Deadline, User
from app.schemas import (
    ActionItemCreate, ActionItemUpdate, ActionItemResponse,
    DocumentDetailResponse
)
from app.security import get_current_user
from app.services.pdf_service import pdf_service
from app.services.ai_service import ai_service
from app.services.calendar_service import calendar_service

router = APIRouter(prefix="/api/documents", tags=["Analysis & Actions"])

@router.post("/{document_id}/actions", response_model=ActionItemResponse)
def create_action_item(
    document_id: str,
    action_in: ActionItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    last_item = db.query(ActionItem).filter(ActionItem.document_id == document_id).order_by(ActionItem.order_idx.desc()).first()
    next_order = (last_item.order_idx + 1) if last_item else 0
    
    new_action = ActionItem(
        document_id=document_id,
        task=action_in.task,
        priority=action_in.priority,
        category=action_in.category,
        assignee=action_in.assignee,
        page_number=action_in.page_number,
        order_idx=next_order,
        is_completed=False
    )
    db.add(new_action)
    db.commit()
    db.refresh(new_action)
    return new_action

@router.patch("/{document_id}/actions/{action_id}", response_model=ActionItemResponse)
def update_action_item(
    document_id: str,
    action_id: str,
    action_update: ActionItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    action = db.query(ActionItem).filter(ActionItem.id == action_id, ActionItem.document_id == document_id).first()
    if not action:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Action item not found")
        
    update_data = action_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(action, field, value)
        
    db.commit()
    db.refresh(action)
    return action

@router.delete("/{document_id}/actions/{action_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_action_item(
    document_id: str,
    action_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    action = db.query(ActionItem).filter(ActionItem.id == action_id, ActionItem.document_id == document_id).first()
    if not action:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Action item not found")
        
    db.delete(action)
    db.commit()
    return None

@router.get("/{document_id}/deadlines/calendar.ics")
def export_deadlines_calendar(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    deadlines = db.query(Deadline).filter(Deadline.document_id == document_id).all()
    ics_bytes = calendar_service.generate_ics(doc.title, deadlines)
    
    clean_title = "".join(c for c in doc.title if c.isalnum() or c in (' ', '_', '-')).rstrip()
    return Response(
        content=ics_bytes,
        media_type="text/calendar",
        headers={"Content-Disposition": f'attachment; filename="{clean_title}_Deadlines.ics"'}
    )

@router.post("/{document_id}/reanalyze", response_model=DocumentDetailResponse)
def reanalyze_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    doc_info = pdf_service.extract_document_info(doc.file_path)
    analysis_data = ai_service.analyze_document(doc.file_path, doc_info)
    
    # 1. Update analysis record
    if doc.analysis:
        doc.analysis.executive_summary = analysis_data.get("executive_summary", "")
        doc.analysis.key_takeaways = analysis_data.get("key_takeaways", [])
        doc.analysis.stakeholders = analysis_data.get("stakeholders", [])
        doc.analysis.risks_and_requirements = analysis_data.get("risks_and_requirements", [])
        doc.analysis.suggested_questions = analysis_data.get("suggested_questions", [])
        doc.analysis.raw_response = analysis_data
    else:
        new_analysis = DocumentAnalysis(
            document_id=doc.id,
            executive_summary=analysis_data.get("executive_summary", ""),
            key_takeaways=analysis_data.get("key_takeaways", []),
            stakeholders=analysis_data.get("stakeholders", []),
            risks_and_requirements=analysis_data.get("risks_and_requirements", []),
            suggested_questions=analysis_data.get("suggested_questions", []),
            raw_response=analysis_data
        )
        db.add(new_analysis)

    # 2. Refresh action items with document-adapted actions
    fresh_actions = analysis_data.get("action_items", [])
    if fresh_actions:
        db.query(ActionItem).filter(ActionItem.document_id == doc.id).delete()
        for idx, item in enumerate(fresh_actions):
            action = ActionItem(
                document_id=doc.id,
                task=item.get("task", ""),
                priority=item.get("priority", "Medium"),
                category=item.get("category", "General"),
                assignee=item.get("assignee"),
                page_number=item.get("page_number"),
                order_idx=idx
            )
            db.add(action)

    # 3. Refresh deadlines with document-adapted deadlines
    fresh_deadlines = analysis_data.get("deadlines", [])
    if fresh_deadlines:
        db.query(Deadline).filter(Deadline.document_id == doc.id).delete()
        for d in fresh_deadlines:
            deadline = Deadline(
                document_id=doc.id,
                title=d.get("title", "Milestone"),
                due_date=d.get("due_date", "2026-09-01"),
                description=d.get("description"),
                page_number=d.get("page_number"),
                category=d.get("category", "Milestone")
            )
            db.add(deadline)
        
    doc.archetype = analysis_data.get("archetype", doc.archetype)
    db.commit()
    db.refresh(doc)
    return doc
