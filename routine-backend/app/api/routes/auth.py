from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, UserRole
from app.core.security import verify_password, create_token
from app.schemas.auth import LoginRequest, TokenResponse
from app.core.auth import get_current_user
from app.core.dependencies import (
    get_current_user,
    get_current_school_id,
)

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    if not user or not verify_password(data.password, user.password):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Account disabled"
        )

    token = create_token({
        "user_id": str(user.id),
        "role": user.role,
        "school_id": str(user.school_id) if user.school_id else None
    })

    return {"access_token": token}

@router.get("/me")
def me(
    current_user: User = Depends(get_current_user),
    school_id=Depends(get_current_school_id),
):

    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "role": current_user.role,
        "school_id": str(school_id),
        "is_active": current_user.is_active,
    }