from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db import get_db
from app.modules.ordonnances.models import Ordonnance
from app.modules.ordonnances.schemas import OrdonnanceCreate, OrdonnanceResponse, OrdonnanceUpdate
from app.modules.auth.service import get_current_doctor
from app.modules.auth.models import Doctor
from datetime import datetime

router = APIRouter(tags=["ordonnances"])

# Create new ordonnance
@router.post("/", response_model=OrdonnanceResponse)
async def create_ordonnance(
    ordonnance: OrdonnanceCreate,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
) -> OrdonnanceResponse:
    try:
        print(f"Received ordonnance data: {ordonnance}")
        print(f"Ordonnance date type: {type(ordonnance.date)}")
        print(f"Ordonnance date value: {ordonnance.date}")
        
        # Convert timezone-aware datetime to naive datetime for database
        if hasattr(ordonnance.date, 'tzinfo') and ordonnance.date.tzinfo is not None:
            print(f"Converting timezone-aware datetime to naive")
            ordonnance.date = ordonnance.date.replace(tzinfo=None)
        
        db_ordonnance = Ordonnance(**ordonnance.dict(), doctor_id=current_doctor.id)
        db.add(db_ordonnance)
        await db.commit()
        await db.refresh(db_ordonnance)
        return db_ordonnance
    except Exception as e:
        await db.rollback()
        print(f"Error creating ordonnance: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create ordonnance: {str(e)}")

# Get patient ordonnances
@router.get("/patient/{patient_id}", response_model=list[OrdonnanceResponse])
async def get_patient_ordonnances(
    patient_id: int,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
) -> list[OrdonnanceResponse]:
    try:
        result = await db.execute(
            select(Ordonnance).where(
                Ordonnance.patient_id == patient_id,
                Ordonnance.doctor_id == current_doctor.id
            ).order_by(Ordonnance.date.desc())
        )
        ordonnances = result.scalars().all()
        return ordonnances
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get ordonnances: {str(e)}")

# Get single ordonnance
@router.get("/{ordonnance_id}", response_model=OrdonnanceResponse)
async def get_ordonnance(
    ordonnance_id: int,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
) -> OrdonnanceResponse:
    try:
        result = await db.execute(
            select(Ordonnance).where(
                Ordonnance.id == ordonnance_id,
                Ordonnance.doctor_id == current_doctor.id
            )
        )
        ordonnance = result.scalar_one_or_none()
        if not ordonnance:
            raise HTTPException(status_code=404, detail="Ordonnance not found")
        return ordonnance
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get ordonnance: {str(e)}")

# Update ordonnance
@router.put("/{ordonnance_id}", response_model=OrdonnanceResponse)
async def update_ordonnance(
    ordonnance_id: int,
    ordonnance_update: OrdonnanceUpdate,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
) -> OrdonnanceResponse:
    try:
        result = await db.execute(
            select(Ordonnance).where(
                Ordonnance.id == ordonnance_id,
                Ordonnance.doctor_id == current_doctor.id
            )
        )
        ordonnance = result.scalar_one_or_none()
        if not ordonnance:
            raise HTTPException(status_code=404, detail="Ordonnance not found")
        
        update_data = ordonnance_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(ordonnance, field, value)
        
        ordonnance.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(ordonnance)
        return ordonnance
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update ordonnance: {str(e)}")

# Delete ordonnance
@router.delete("/{ordonnance_id}")
async def delete_ordonnance(
    ordonnance_id: int,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    try:
        result = await db.execute(
            select(Ordonnance).where(
                Ordonnance.id == ordonnance_id,
                Ordonnance.doctor_id == current_doctor.id
            )
        )
        ordonnance = result.scalar_one_or_none()
        if not ordonnance:
            raise HTTPException(status_code=404, detail="Ordonnance not found")
        
        await db.delete(ordonnance)
        await db.commit()
        return {"message": "Ordonnance deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete ordonnance: {str(e)}")
