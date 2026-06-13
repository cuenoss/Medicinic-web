import asyncio
import os
import random
import string
import resend
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import Doctor
from .schemas import DoctorCreate, DoctorLogin, DoctorResponse, TokenResponse
from app.db import get_db

# ── Config ───────────────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7
VERIFICATION_CODE_EXPIRE_MINUTES = 15

ADMIN_EMAILS = [e.strip().lower() for e in os.getenv("ADMIN_EMAILS", "").split(",") if e.strip()]

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")

resend.api_key = RESEND_API_KEY

# ── Helpers ───────────────────────────────────────────────────────────────────
def is_admin_email(email: str) -> bool:
    return bool(email) and email.lower() in ADMIN_EMAILS

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict) -> str:
    """Long-lived token used only to obtain a new access token (type='refresh')."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def generate_verification_code(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))

async def get_doctor_by_email(db: AsyncSession, email: str) -> Optional[Doctor]:
    result = await db.execute(select(Doctor).where(Doctor.email == email))
    return result.scalars().first()

# ── Email sending ─────────────────────────────────────────────────────────────
async def send_verification_email(email: str, full_name: str, code: str) -> None:
    """Send a 6-digit verification code via Resend."""
    if not RESEND_API_KEY:
        print(f"[DEV] Verification code for {email}: {code}")
        return

    params: resend.Emails.SendParams = {
        "from": RESEND_FROM_EMAIL,
        "to": [email],
        "subject": "Your MediClinic Verification Code",
        "html": f"""
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
          <h2 style="color:#1d4ed8;">Verify your email</h2>
          <p>Hi {full_name},</p>
          <p>Use the code below to verify your MediClinic account.
             It expires in <strong>{VERIFICATION_CODE_EXPIRE_MINUTES} minutes</strong>.</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:8px;
                      background:#eff6ff;border-radius:8px;padding:20px;
                      text-align:center;color:#1d4ed8;margin:24px 0;">
            {code}
          </div>
          <p style="color:#64748b;font-size:14px;">
            If you didn't create a MediClinic account, you can safely ignore this email.
          </p>
        </div>
        """,
    }
    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, lambda: resend.Emails.send(params))
        print(f"[Resend] Sent verification to {email}, id={result}")
    except Exception as exc:
        print(f"[Resend ERROR] Failed to send to {email}: {exc}")
        # Don't raise — user is already registered and can use 'Resend code'

# ── Auth functions ────────────────────────────────────────────────────────────
async def register_doctor(db: AsyncSession, doctor_data: DoctorCreate) -> dict:
    existing = await get_doctor_by_email(db, doctor_data.email)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    code = generate_verification_code()
    now = datetime.utcnow()

    doctor = Doctor(
        fullName=doctor_data.fullName,
        email=doctor_data.email,
        hashed_password=hash_password(doctor_data.password),
        created_at=now,
        updated_at=now,
        is_verified=False,
        verification_code=code,
        verification_code_expires_at=now + timedelta(minutes=VERIFICATION_CODE_EXPIRE_MINUTES),
    )
    db.add(doctor)
    await db.commit()
    await db.refresh(doctor)

    await send_verification_email(doctor.email, doctor.fullName, code)

    return {
        "message": "Registration successful. Please check your email for the verification code.",
        "email": doctor.email,
    }


async def verify_email_code(db: AsyncSession, email: str, code: str) -> dict:
    doctor = await get_doctor_by_email(db, email)
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    if doctor.is_verified:
        return {"message": "Email already verified"}

    if not doctor.verification_code or doctor.verification_code != code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification code")

    if not doctor.verification_code_expires_at or datetime.utcnow() > doctor.verification_code_expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new one.",
        )

    doctor.is_verified = True
    doctor.verification_code = None
    doctor.verification_code_expires_at = None
    doctor.updated_at = datetime.utcnow()
    await db.commit()

    return {"message": "Email verified successfully. You can now log in."}


async def resend_verification_code(db: AsyncSession, email: str) -> dict:
    doctor = await get_doctor_by_email(db, email)
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    if doctor.is_verified:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already verified")

    code = generate_verification_code()
    doctor.verification_code = code
    doctor.verification_code_expires_at = datetime.utcnow() + timedelta(minutes=VERIFICATION_CODE_EXPIRE_MINUTES)
    doctor.updated_at = datetime.utcnow()
    await db.commit()

    await send_verification_email(doctor.email, doctor.fullName, code)
    return {"message": "A new verification code has been sent to your email."}


async def login_doctor(db: AsyncSession, doctor_data: DoctorLogin) -> dict:
    doctor = await get_doctor_by_email(db, doctor_data.email)
    if not doctor:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not verify_password(doctor_data.password, doctor.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not doctor.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please check your inbox for the verification code.",
        )

    code = generate_verification_code()
    now = datetime.utcnow()
    doctor.verification_code = code
    doctor.verification_code_expires_at = now + timedelta(minutes=VERIFICATION_CODE_EXPIRE_MINUTES)
    doctor.updated_at = now
    await db.commit()

    await send_verification_email(doctor.email, doctor.fullName, code)
    return {"status": "code_sent", "email": doctor.email}


async def verify_login_code(db: AsyncSession, email: str, code: str) -> TokenResponse:
    doctor = await get_doctor_by_email(db, email)
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    if not doctor.verification_code or doctor.verification_code != code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid code")

    if not doctor.verification_code_expires_at or datetime.utcnow() > doctor.verification_code_expires_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Code expired. Please log in again.")

    doctor.verification_code = None
    doctor.verification_code_expires_at = None
    doctor.updated_at = datetime.utcnow()
    await db.commit()

    access_token = create_access_token(
        data={"sub": doctor.email, "doctor_id": doctor.id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    refresh_token = create_refresh_token(data={"sub": doctor.email, "doctor_id": doctor.id})

    doctor_response = DoctorResponse.from_orm(doctor)
    doctor_response.is_admin = is_admin_email(doctor.email)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        doctor=doctor_response,
    )


async def resend_login_code(db: AsyncSession, email: str) -> dict:
    doctor = await get_doctor_by_email(db, email)
    if not doctor or not doctor.is_verified:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    code = generate_verification_code()
    doctor.verification_code = code
    doctor.verification_code_expires_at = datetime.utcnow() + timedelta(minutes=VERIFICATION_CODE_EXPIRE_MINUTES)
    doctor.updated_at = datetime.utcnow()
    await db.commit()

    await send_verification_email(doctor.email, doctor.fullName, code)
    return {"message": "A new login code has been sent to your email."}


async def forgot_password(db: AsyncSession, email: str) -> dict:
    doctor = await get_doctor_by_email(db, email)
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No account found with this email")

    reset_token = create_access_token(
        data={"sub": doctor.email, "type": "password_reset"},
        expires_delta=timedelta(minutes=15),
    )
    return {"message": "Password reset link has been sent to your email", "reset_token": reset_token}


async def reset_password(db: AsyncSession, token: str, new_password: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        token_type = payload.get("type")
        if email is None or token_type != "password_reset":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reset token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reset token")

    doctor = await get_doctor_by_email(db, email)
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No account found with this email")

    doctor.hashed_password = hash_password(new_password)
    doctor.updated_at = datetime.utcnow()
    await db.commit()

    return {"message": "Password reset successful"}


async def refresh_access_token(db: AsyncSession, refresh_token: str) -> TokenResponse:
    """Exchange a valid refresh token for a fresh access + refresh token pair."""
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    doctor = await get_doctor_by_email(db, email)
    if not doctor:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account not found")

    access_token = create_access_token(
        data={"sub": doctor.email, "doctor_id": doctor.id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    new_refresh_token = create_refresh_token(data={"sub": doctor.email, "doctor_id": doctor.id})

    doctor_response = DoctorResponse.from_orm(doctor)
    doctor_response.is_admin = is_admin_email(doctor.email)

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        doctor=doctor_response,
    )


async def get_current_doctor(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> Doctor:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")

    doctor = await get_doctor_by_email(db, email)
    if doctor is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Doctor not found")

    return doctor


async def get_current_admin(current_doctor: Doctor = Depends(get_current_doctor)) -> Doctor:
    if not is_admin_email(current_doctor.email):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_doctor
