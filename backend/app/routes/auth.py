import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.auth_dependencies import get_current_user
from app.database.dependencies import get_db
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    RegisterResponse,
    ResetPasswordRequest,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
)
from app.services.auth_service import (
    RESET_TOKEN_EXPIRE_MINUTES,
    create_access_token,
    generate_secure_token,
    hash_password,
    reset_token_expiry,
    verify_password,
)
from app.services.email_service import EmailService

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)

logger = logging.getLogger(__name__)
PASSWORD_RESET_REQUEST_MESSAGE = (
    "If an account with this email exists, a password reset link has been sent."
)


@router.post("/register", response_model=RegisterResponse)
def register(
    payload: UserRegister,
    db: Session = Depends(get_db),
):
    existing_user = (
        db.query(User)
        .filter(func.lower(User.email) == payload.email.lower())
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = User(
        full_name=payload.full_name.strip(),
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        is_verified=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "message": "Account created successfully. You can now log in.",
        "user": user,
    }


@router.post("/login", response_model=TokenResponse)
def login(
    payload: UserLogin,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(func.lower(User.email) == payload.email.lower())
        .first()
    )

    if not user or not verify_password(
        payload.password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token({"sub": str(user.id)})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(func.lower(User.email) == payload.email.lower())
        .first()
    )

    if not user:
        return {
            "message": PASSWORD_RESET_REQUEST_MESSAGE,
        }

    reset_token = generate_secure_token()
    user.reset_token = reset_token
    user.reset_token_expires_at = reset_token_expiry()
    db.commit()

    try:
        EmailService().send_password_reset_email(
            to_email=user.email,
            token=reset_token,
            expires_minutes=RESET_TOKEN_EXPIRE_MINUTES,
        )
    except Exception:
        logger.exception(
            "Failed to send password reset email for user_id=%s",
            user.id,
        )

    return {
        "message": PASSWORD_RESET_REQUEST_MESSAGE,
    }


@router.post("/reset-password")
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.reset_token == payload.token)
        .first()
    )

    if (
        not user
        or not user.reset_token_expires_at
        or user.reset_token_expires_at < datetime.utcnow()
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    user.hashed_password = hash_password(payload.new_password)
    user.reset_token = None
    user.reset_token_expires_at = None
    db.commit()

    return {
        "message": "Password reset successful.",
    }
