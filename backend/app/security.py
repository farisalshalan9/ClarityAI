from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User
from app.services.supabase_service import supabase_service

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    now_utc = datetime.now(timezone.utc)
    if expires_delta:
        expire = now_utc + expires_delta
    else:
        expire = now_utc + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_token_payload(auth_token: str) -> Optional[dict]:
    # 1. Try with self-hosted secret
    try:
        return jwt.decode(auth_token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        pass

    # 2. Try with Supabase JWT Secret if configured
    if settings.SUPABASE_JWT_SECRET:
        try:
            return jwt.decode(auth_token, settings.SUPABASE_JWT_SECRET, algorithms=["HS256"])
        except JWTError:
            pass

    return None

def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    t: Optional[str] = Query(None),
    token_query: Optional[str] = Query(None, alias="token"),
    db: Session = Depends(get_db)
) -> User:
    auth_token = token or t or token_query
    if not auth_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 1. Try decode payload
    payload = decode_token_payload(auth_token)
    user_id = payload.get("sub") if payload else None
    
    # 2. If payload decode failed, check Supabase Auth API
    if not user_id and supabase_service.is_enabled():
        sb_user = supabase_service.get_user_from_token(auth_token)
        if sb_user:
            user_id = sb_user.get("id")
            # Sync user to local database if not present
            existing = db.query(User).filter(User.id == user_id).first()
            if not existing and user_id and sb_user.get("email"):
                existing = User(
                    id=user_id,
                    email=sb_user["email"].lower(),
                    hashed_password="[SUPABASE_MANAGED_AUTH]",
                    full_name=sb_user.get("full_name") or sb_user["email"].split("@")[0].capitalize()
                )
                db.add(existing)
                db.commit()
                db.refresh(existing)
            if existing:
                return existing

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        # Fallback query by email if sub was an email or user payload had email
        if payload and payload.get("email"):
            user = db.query(User).filter(User.email == payload.get("email").lower()).first()
            
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def get_optional_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    t: Optional[str] = Query(None),
    token_query: Optional[str] = Query(None, alias="token"),
    db: Session = Depends(get_db)
) -> Optional[User]:
    auth_token = token or t or token_query
    if not auth_token:
        return None
    try:
        payload = decode_token_payload(auth_token)
        user_id = payload.get("sub") if payload else None
        if not user_id and supabase_service.is_enabled():
            sb_user = supabase_service.get_user_from_token(auth_token)
            if sb_user:
                user_id = sb_user.get("id")
        if user_id:
            return db.query(User).filter(User.id == user_id).first()
    except Exception:
        return None
    return None

