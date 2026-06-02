from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db import get_db
from app.modules.consultations.models import Consultation
from app.modules.consultations.schemas import ConsultationCreate, ConsultationResponse, ConsultationUpdate
from app.modules.auth.service import get_current_doctor
from app.modules.auth.models import Doctor
from datetime import datetime

router = APIRouter(tags=["consultations"])

# Create new consultation
@router.post("/", response_model=ConsultationResponse)
async def create_consultation(
    consultation: ConsultationCreate,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
) -> ConsultationResponse:
    try:
        # Convert string date to datetime if needed
        if isinstance(consultation.date, str):
            consultation.date = datetime.fromisoformat(consultation.date.replace('Z', '+00:00'))

        # Convert timezone-aware datetime to naive datetime for database
        if hasattr(consultation.date, 'tzinfo') and consultation.date.tzinfo is not None:
            consultation.date = consultation.date.replace(tzinfo=None)

        db_consultation = Consultation(**consultation.dict(), doctor_id=current_doctor.id)
        db.add(db_consultation)
        await db.commit()
        await db.refresh(db_consultation)
        
        return ConsultationResponse.from_orm(db_consultation)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create consultation: {str(e)}")

# Get all consultations for a patient
@router.get("/patient/{patient_id}", response_model=list[ConsultationResponse])
async def get_patient_consultations(
    patient_id: int,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
) -> list[ConsultationResponse]:
    try:
        result = await db.execute(
            select(Consultation).where(
                Consultation.patient_id == patient_id,
                Consultation.doctor_id == current_doctor.id
            ).order_by(Consultation.date.desc())
        )
        consultations = result.scalars().all()
        return [ConsultationResponse.from_orm(consultation) for consultation in consultations]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch consultations: {str(e)}")

# Get specific consultation by ID
@router.get("/{consultation_id}", response_model=ConsultationResponse)
async def get_consultation(
    consultation_id: int,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
) -> ConsultationResponse:
    try:
        result = await db.execute(
            select(Consultation).where(
                Consultation.id == consultation_id,
                Consultation.doctor_id == current_doctor.id
            )
        )
        consultation = result.scalars().first()
        
        if not consultation:
            raise HTTPException(status_code=404, detail="Consultation not found")
        
        return ConsultationResponse.from_orm(consultation)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch consultation: {str(e)}")

# Update consultation
@router.put("/{consultation_id}", response_model=ConsultationResponse)
async def update_consultation(
    consultation_id: int,
    consultation_update: ConsultationUpdate,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
) -> ConsultationResponse:
    try:
        result = await db.execute(
            select(Consultation).where(
                Consultation.id == consultation_id,
                Consultation.doctor_id == current_doctor.id
            )
        )
        consultation = result.scalars().first()
        
        if not consultation:
            raise HTTPException(status_code=404, detail="Consultation not found")
        
        # Update only provided fields
        update_data = consultation_update.dict(exclude_unset=True)
        
        # Convert string date to datetime if needed
        if 'date' in update_data and isinstance(update_data['date'], str):
            update_data['date'] = datetime.fromisoformat(update_data['date'].replace('Z', '+00:00'))
        
        for field, value in update_data.items():
            setattr(consultation, field, value)
        
        await db.commit()
        await db.refresh(consultation)
        
        return ConsultationResponse.from_orm(consultation)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update consultation: {str(e)}")

# Delete consultation
@router.delete("/{consultation_id}")
async def delete_consultation(
    consultation_id: int,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    try:
        result = await db.execute(
            select(Consultation).where(
                Consultation.id == consultation_id,
                Consultation.doctor_id == current_doctor.id
            )
        )
        consultation = result.scalars().first()
        
        if not consultation:
            raise HTTPException(status_code=404, detail="Consultation not found")
        
        await db.delete(consultation)
        await db.commit()
        
        return {"message": "Consultation deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete consultation: {str(e)}")
