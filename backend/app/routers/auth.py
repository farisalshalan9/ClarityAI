from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import UserRegister, UserLogin, UserResponse, TokenResponse
from app.security import verify_password, get_password_hash, create_access_token, get_current_user
from app.services.supabase_service import supabase_service

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    email_clean = user_in.email.strip().lower()
    full_name_clean = (user_in.full_name or email_clean.split("@")[0].capitalize()).strip()

    # 1. Supabase Auth Route (with fallback to local auth on rate limit)
    if supabase_service.is_enabled():
        try:
            sb_res = supabase_service.signup(
                email=email_clean,
                password=user_in.password,
                full_name=full_name_clean
            )
            sb_user_id = sb_res.get("user_id")
            
            # Ensure user profile exists in database
            db_user = db.query(User).filter((User.email == email_clean) | (User.id == sb_user_id)).first()
            if not db_user:
                db_user = User(
                    id=sb_user_id,
                    email=email_clean,
                    hashed_password="[SUPABASE_MANAGED_AUTH]",
                    full_name=full_name_clean
                )
                db.add(db_user)
                db.commit()
                db.refresh(db_user)

            token = sb_res.get("access_token")
            if not token:
                token = create_access_token(data={"sub": db_user.id, "email": db_user.email})

            return {
                "access_token": token,
                "token_type": "bearer",
                "user": db_user
            }
        except HTTPException as he:
            if "already exists" in he.detail.lower():
                raise he
            # If rate limited or other non-fatal error, fall through to local auth engine
            pass
        except Exception:
            pass

    # 2. Self-Hosted / Local Fallback Route
    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
        )
    
    new_user = User(
        email=email_clean,
        hashed_password=get_password_hash(user_in.password),
        full_name=full_name_clean
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.id, "email": new_user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user
    }

@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    email_clean = credentials.email.strip().lower()

    # 1. Supabase Auth Route
    if supabase_service.is_enabled():
        sb_res = supabase_service.login(email=email_clean, password=credentials.password)
        sb_user_id = sb_res.get("user_id")
        access_token = sb_res.get("access_token")
        
        # Ensure user profile exists in database
        db_user = db.query(User).filter((User.email == email_clean) | (User.id == sb_user_id)).first()
        if not db_user:
            db_user = User(
                id=sb_user_id,
                email=email_clean,
                hashed_password="[SUPABASE_MANAGED_AUTH]",
                full_name=sb_res.get("full_name") or email_clean.split("@")[0].capitalize()
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)

        return {
            "access_token": access_token or create_access_token(data={"sub": db_user.id, "email": db_user.email}),
            "token_type": "bearer",
            "user": db_user
        }

    # 2. Self-Hosted / Local Fallback Route
    user = db.query(User).filter(User.email == email_clean).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.id, "email": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

