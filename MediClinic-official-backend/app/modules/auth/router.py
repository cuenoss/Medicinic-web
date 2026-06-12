from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from .models import Doctor
from .service import (
    register_doctor, login_doctor, forgot_password, reset_password,
    verify_email_code, resend_verification_code, verify_login_code, resend_login_code, get_current_doctor,
)
from .schemas import (
    DoctorCreate, DoctorLogin, DoctorResponse, TokenResponse,
    VerifyEmailRequest, ResendVerificationRequest,
)
from app.db import get_db

router = APIRouter()


@router.post("/register")
async def register(
    doctor_data: DoctorCreate,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await register_doctor(db, doctor_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Registration failed: {str(e)}")


@router.post("/verify-email")
async def verify_email(
    body: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db),
):
    """Verify email address with the 6-digit code sent after registration."""
    try:
        return await verify_email_code(db, body.email, body.code)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Verification failed: {str(e)}")


@router.post("/resend-verification")
async def resend_verification(
    body: ResendVerificationRequest,
    db: AsyncSession = Depends(get_db),
):
    """Resend the email verification code."""
    try:
        return await resend_verification_code(db, body.email)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Resend failed: {str(e)}")


@router.post("/login")
async def login(
    doctor_data: DoctorLogin,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await login_doctor(db, doctor_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Login failed. Please try again.")


@router.post("/verify-login")
async def verify_login(
    body: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db),
):
    """Verify login OTP code and return JWT token."""
    try:
        return await verify_login_code(db, body.email, body.code)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/resend-login-code")
async def resend_login(
    body: ResendVerificationRequest,
    db: AsyncSession = Depends(get_db),
):
    """Resend login OTP code."""
    try:
        return await resend_login_code(db, body.email)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/forgot-password")
async def forgot_password_endpoint(
    email: str,
    db: AsyncSession = Depends(get_db),
):
    """Send password reset link to email."""
    try:
        return await forgot_password(db, email)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to send reset email. Please try again.")


@router.post("/reset-password")
async def reset_password_endpoint(
    token: str,
    new_password: str,
    db: AsyncSession = Depends(get_db),
):
    """Reset password using token."""
    try:
        return await reset_password(db, token, new_password)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Password reset failed. Please try again.")


@router.get("/me", response_model=DoctorResponse)
async def get_current_user(
    current_doctor: Doctor = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    """Get current authenticated doctor."""
    return current_doctor


@router.post("/logout")
async def logout():
    """Logout current user (client-side token removal)."""
    return {"message": "Successfully logged out"}
