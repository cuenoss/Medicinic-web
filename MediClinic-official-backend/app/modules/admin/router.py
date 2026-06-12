from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.modules.auth.models import Doctor
from app.modules.auth.service import is_admin_email
from app.modules.patients.models import Patient

router = APIRouter(tags=["admin"])


@router.get("/doctors")
async def list_doctors(db: AsyncSession = Depends(get_db)) -> List[Dict[str, Any]]:
    """Return every registered account with its patient count. Admin-only."""
    try:
        # Patient count per doctor (single grouped query)
        counts_result = await db.execute(
            select(Patient.doctor_id, func.count(Patient.id)).group_by(Patient.doctor_id)
        )
        counts = {row[0]: row[1] for row in counts_result.all()}

        result = await db.execute(select(Doctor).order_by(Doctor.id))
        doctors = result.scalars().all()

        return [
            {
                "id": d.id,
                "fullName": d.fullName,
                "email": d.email,
                "is_admin": is_admin_email(d.email),
                "created_at": d.created_at.isoformat() if d.created_at else None,
                "patient_count": counts.get(d.id, 0),
            }
            for d in doctors
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch accounts: {str(e)}")


@router.delete("/doctors/{doctor_id}")
async def delete_doctor(doctor_id: int, db: AsyncSession = Depends(get_db)) -> Dict[str, str]:
    """Permanently delete a doctor account from the database."""
    result = await db.execute(select(Doctor).where(Doctor.id == doctor_id))
    doctor = result.scalars().first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    await db.delete(doctor)
    await db.commit()
    return {"message": f"Account {doctor.email} deleted successfully"}


@router.post("/doctors/{doctor_id}/verify")
async def force_verify_doctor(doctor_id: int, db: AsyncSession = Depends(get_db)) -> Dict[str, str]:
    """Manually mark a doctor's email as verified (admin use)."""
    result = await db.execute(select(Doctor).where(Doctor.id == doctor_id))
    doctor = result.scalars().first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    doctor.is_verified = True
    doctor.verification_code = None
    doctor.verification_code_expires_at = None
    await db.commit()
    return {"message": f"{doctor.email} has been manually verified"}
