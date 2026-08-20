from typing import List, Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# Auth Schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Action Item Schemas
class ActionItemBase(BaseModel):
    task: str
    priority: str = "Medium"  # High, Medium, Low
    category: str = "General"
    assignee: Optional[str] = None
    page_number: Optional[int] = None

class ActionItemCreate(ActionItemBase):
    pass

class ActionItemUpdate(BaseModel):
    task: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    assignee: Optional[str] = None
    is_completed: Optional[bool] = None
    page_number: Optional[int] = None

class ActionItemResponse(ActionItemBase):
    id: str
    document_id: str
    is_completed: bool
    order_idx: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Deadline Schemas
class DeadlineBase(BaseModel):
    title: str
    due_date: str
    description: Optional[str] = None
    page_number: Optional[int] = None
    category: str = "Deadline"

class DeadlineCreate(DeadlineBase):
    pass

class DeadlineResponse(DeadlineBase):
    id: str
    document_id: str
    is_completed: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Risk & Requirement Item
class RiskRequirement(BaseModel):
    type: str  # Requirement, Risk, Red Flag, Financial, Compliance
    description: str
    severity: str = "Medium"  # High, Medium, Low, Critical
    page_number: Optional[int] = None

# Analysis Schemas
class DocumentAnalysisResponse(BaseModel):
    id: str
    document_id: str
    executive_summary: str
    key_takeaways: List[str] = []
    stakeholders: List[str] = []
    risks_and_requirements: List[Dict[str, Any]] = []
    suggested_questions: List[str] = []
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Document Schemas
class DocumentResponse(BaseModel):
    id: str
    title: str
    filename: str
    file_size: int
    page_count: int
    archetype: str
    status: str
    error_message: Optional[str] = None
    is_public: bool
    share_token: str
    created_at: datetime
    updated_at: datetime
    action_items_total: Optional[int] = 0
    action_items_completed: Optional[int] = 0
    model_config = ConfigDict(from_attributes=True)

class DocumentDetailResponse(DocumentResponse):
    analysis: Optional[DocumentAnalysisResponse] = None
    action_items: List[ActionItemResponse] = []
    deadlines: List[DeadlineResponse] = []

# Chat Schemas
class Citation(BaseModel):
    page: int
    quote: Optional[str] = None
    snippet: Optional[str] = None

class ChatMessageRequest(BaseModel):
    content: str

class ChatMessageResponse(BaseModel):
    id: str
    document_id: str
    role: str
    content: str
    citations: List[Dict[str, Any]] = []
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Quick Tools
class QuickToolRequest(BaseModel):
    tool_type: str  # "email_draft", "eli5", "risk_audit", "table_extract"
    extra_instructions: Optional[str] = None

class QuickToolResponse(BaseModel):
    tool_type: str
    title: str
    result: str
    data: Optional[Any] = None

# Share Schemas
class ShareStatusUpdate(BaseModel):
    is_public: bool
