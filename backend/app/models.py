import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    documents = relationship("Document", back_populates="owner", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, default=0)
    page_count = Column(Integer, default=1)
    archetype = Column(String, default="General Document")
    status = Column(String, default="ready")  # uploaded, analyzing, ready, error
    error_message = Column(Text, nullable=True)
    is_public = Column(Boolean, default=False)
    share_token = Column(String, unique=True, index=True, default=generate_uuid)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    owner = relationship("User", back_populates="documents")
    analysis = relationship("DocumentAnalysis", back_populates="document", uselist=False, cascade="all, delete-orphan")
    action_items = relationship("ActionItem", back_populates="document", cascade="all, delete-orphan", order_by="ActionItem.order_idx")
    deadlines = relationship("Deadline", back_populates="document", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="document", cascade="all, delete-orphan", order_by="ChatMessage.created_at")

class DocumentAnalysis(Base):
    __tablename__ = "document_analyses"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id"), nullable=False, unique=True)
    executive_summary = Column(Text, nullable=False)
    key_takeaways = Column(JSON, default=list)  # List of strings
    stakeholders = Column(JSON, default=list)  # List of strings/objects
    risks_and_requirements = Column(JSON, default=list)  # List of {type, description, severity, page}
    suggested_questions = Column(JSON, default=list)  # List of dynamic, document-tailored questions
    raw_response = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    document = relationship("Document", back_populates="analysis")

class ActionItem(Base):
    __tablename__ = "action_items"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id"), nullable=False)
    task = Column(Text, nullable=False)
    priority = Column(String, default="Medium")  # High, Medium, Low
    category = Column(String, default="General")  # Immediate, Administrative, Review, Financial, Technical
    assignee = Column(String, nullable=True)
    is_completed = Column(Boolean, default=False)
    page_number = Column(Integer, nullable=True)
    order_idx = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    document = relationship("Document", back_populates="action_items")

class Deadline(Base):
    __tablename__ = "deadlines"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id"), nullable=False)
    title = Column(String, nullable=False)
    due_date = Column(String, nullable=False)  # ISO string or human-readable date
    description = Column(Text, nullable=True)
    page_number = Column(Integer, nullable=True)
    category = Column(String, default="Deadline")  # Milestone, Expiration, Filing, Review
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    document = relationship("Document", back_populates="deadlines")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    role = Column(String, nullable=False)  # user, assistant
    content = Column(Text, nullable=False)
    citations = Column(JSON, default=list)  # List of {page: int, quote: str, snippet: str}
    created_at = Column(DateTime, default=datetime.utcnow)
    
    document = relationship("Document", back_populates="chat_messages")
    user = relationship("User", back_populates="chat_messages")
