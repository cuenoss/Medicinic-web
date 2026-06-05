from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, Depends, APIRouter, UploadFile, File
from fastapi.responses import FileResponse, RedirectResponse
from typing import Optional, List
from app.db import get_db
from app.modules.auth.service import get_current_doctor
from app.modules.auth.models import Doctor
from .models import Patient, attached_files
import os
import uuid
import mimetypes
from datetime import datetime
from app.modules.appointments.models import Appointment
from .schemas import (
    AttachedFileResponse, AttachedFileCreate,
    PatientCreate, PatientUpdate, PatientResponse, PatientSearchFilters, 
    PrescriptionResponse,
    process_comma_separated_field, parse_comma_separated_field
)
from datetime import datetime, timedelta, timezone
import mimetypes
import os
import uuid
import cloudinary
import cloudinary.uploader
from app.cloudinary_config import *

router = APIRouter(tags=["patients"])


def _naive_utc(dt: datetime) -> datetime:
    """TIMESTAMP WITHOUT TIME ZONE + asyncpg cannot bind timezone-aware datetimes."""
    if dt.tzinfo is None:
        return dt
    return dt.astimezone(timezone.utc).replace(tzinfo=None)

# File upload configuration
ALLOWED_EXTENSIONS = {'.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.txt', '.csv'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def validate_file(file: UploadFile) -> bool:
    """Validate uploaded file for security"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"File type {file_ext} not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    return True



# Get all patients with search functionality
@router.get("/", response_model=List[PatientResponse])
async def list_patients(
    db: AsyncSession = Depends(get_db),
    filters: PatientSearchFilters = Depends(),
    page_size: int = 10,
    page: int = 1,
    current_doctor: Doctor = Depends(get_current_doctor)
) -> List[PatientResponse]:
    try:
        query = select(Patient).where(Patient.doctor_id == current_doctor.id)

        if filters.name:
            query = query.where(Patient.full_name.ilike(f"%{filters.name}%"))
        if filters.email:
            query = query.where(Patient.email.ilike(f"%{filters.email}%"))
        if filters.phone:
            query = query.where(Patient.phone.ilike(f"%{filters.phone}%"))
        if filters.gender:
            query = query.where(Patient.gender.ilike(f"%{filters.gender}%"))
        if filters.allergies:
            query = query.where(Patient.allergies.ilike(f"%{filters.allergies}%"))
        if filters.chronic_conditions:
            query = query.where(Patient.chronic_conditions.ilike(f"%{filters.chronic_conditions}%"))
        if filters.age_min is not None or filters.age_max is not None:
            from datetime import date, timedelta
            today = date.today()
            if filters.age_max is not None:
                min_dob = today.replace(year=today.year - filters.age_max - 1)
                query = query.where(Patient.date_of_birth >= min_dob)
            if filters.age_min is not None:
                max_dob = today.replace(year=today.year - filters.age_min)
                query = query.where(Patient.date_of_birth <= max_dob)
        
        # Apply pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)
        
        result = await db.execute(query)
        patients = result.scalars().all()
        
        return [PatientResponse.from_orm(patient) for patient in patients]
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch patients")

# Get specific patient by ID
@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: int,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
) -> PatientResponse:
    try:
        result = await db.execute(
            select(Patient).where(
                Patient.id == patient_id,
                Patient.doctor_id == current_doctor.id
            )
        )
        patient = result.scalars().first()

        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        return PatientResponse.from_orm(patient)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch patient")

# Create new patient
@router.post("/", response_model=PatientResponse)
async def create_patient(
    patient_data: PatientCreate,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
) -> PatientResponse:
    try:
        patient_dict = patient_data.dict()
        current_date = datetime.utcnow().date()
        patient_dict["created_at"] = current_date
        patient_dict["updated_at"] = current_date
        patient_dict["doctor_id"] = current_doctor.id
        
        # Process comma-separated fields
        patient_dict["allergies"] = process_comma_separated_field(patient_dict.get("allergies"))
        patient_dict["chronic_conditions"] = process_comma_separated_field(patient_dict.get("chronic_conditions"))
        
        new_patient = Patient(**patient_dict)
        db.add(new_patient)
        await db.commit()
        await db.refresh(new_patient)

        return PatientResponse.from_orm(new_patient)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create patient")

# Update existing patient
@router.patch("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: int,
    patient_data: PatientUpdate,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
) -> PatientResponse:
    try:
        result = await db.execute(
            select(Patient).where(
                Patient.id == patient_id,
                Patient.doctor_id == current_doctor.id
            )
        )
        patient = result.scalars().first()

        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        update_data = patient_data.dict(exclude_unset=True)
        for key, value in update_data.items():
            if key in ["allergies", "chronic_conditions"]:
                # Process comma-separated fields
                setattr(patient, key, process_comma_separated_field(value))
            else:
                setattr(patient, key, value)
        patient.updated_at = datetime.utcnow().date()
        
        await db.commit()
        await db.refresh(patient)
        
        return PatientResponse.from_orm(patient)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update patient")

# Delete patient
@router.delete("/{patient_id}")
async def delete_patient(
    patient_id: int,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
) -> dict:
    try:
        result = await db.execute(
            select(Patient).where(
                Patient.id == patient_id,
                Patient.doctor_id == current_doctor.id
            )
        )
        patient = result.scalars().first()

        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        db.delete(patient)
        await db.commit()
        
        return {"message": "Patient deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete patient")

    

# Get patient files
@router.get("/{patient_id}/files", response_model=List[AttachedFileResponse])
async def get_patient_files(
    patient_id: int,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
) -> List[AttachedFileResponse]:
    try:
        print(f"DEBUG: Getting files for patient {patient_id}")
        result = await db.execute(
            select(Patient).where(
                Patient.id == patient_id,
                Patient.doctor_id == current_doctor.id
            )
        )
        patient = result.scalars().first()
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        files_result = await db.execute(
            select(attached_files).where(attached_files.patient_id == patient_id)
        )
        files = files_result.scalars().all()
        
        file_ids = [file.id for file in files]
        print(f"DEBUG: Found files with IDs: {file_ids}")
        
        return [AttachedFileResponse.from_orm(file) for file in files]
    except HTTPException:
        raise
    except Exception as e:
        print(f"DEBUG: Error in get_patient_files: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch patient files")

# Get specific patient file
@router.get("/{patient_id}/files/{file_id}")
async def get_patient_file(
    patient_id: int,
    file_id: int,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    try:
        # Validate patient exists and belongs to this doctor
        patient_result = await db.execute(
            select(Patient).where(
                Patient.id == patient_id,
                Patient.doctor_id == current_doctor.id
            )
        )
        patient = patient_result.scalars().first()
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Find file record
        file_result = await db.execute(
            select(attached_files).where(
                attached_files.id == file_id,
                attached_files.patient_id == patient_id
            )
        )
        file_record = file_result.scalars().first()
        
        if not file_record:
            raise HTTPException(status_code=404, detail="File not found")

        # Redirect to Cloudinary URL
        return RedirectResponse(url=file_record.file_path)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to serve file")

# Upload file for patient
@router.post("/{patient_id}/files", response_model=AttachedFileResponse)
async def upload_patient_file(
    patient_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
) -> AttachedFileResponse:
    try:
        # Validate patient exists and belongs to this doctor
        patient_result = await db.execute(
            select(Patient).where(
                Patient.id == patient_id,
                Patient.doctor_id == current_doctor.id
            )
        )
        patient = patient_result.scalars().first()
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Validate file
        validate_file(file)
        
        # Check file size
        if file.size and file.size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400, 
                detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
            )
        
        # Read file content
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
            )

        # MIME type
        file_type = (file.content_type or "").strip() or None
        if not file_type or file_type == "application/octet-stream":
            guessed, _ = mimetypes.guess_type(file.filename)
            if guessed:
                file_type = guessed
        if not file_type:
            file_type = "application/octet-stream"

        # Upload to Cloudinary
        try:
            resource_type = "image" if file_type.startswith("image/") else "raw"
            upload_result = cloudinary.uploader.upload(
                content,
                folder=f"mediclinic/patients/{patient_id}",
                public_id=str(uuid.uuid4()),
                resource_type=resource_type,
                use_filename=False,
            )
            file_url = upload_result["secure_url"]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

        # Save file record to database — store Cloudinary URL in file_path
        new_file = attached_files(
            patient_id=patient_id,
            file_name=file.filename,
            file_path=file_url,
            file_type=file_type,
            created_at=datetime.utcnow(),
        )
        
        db.add(new_file)
        await db.commit()
        await db.refresh(new_file)
        
        return AttachedFileResponse.from_orm(new_file)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to upload file")

# Delete patient file
@router.delete("/{patient_id}/files/{file_id}")
async def delete_patient_file(
    patient_id: int,
    file_id: int,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
) -> dict:
    try:
        # Validate patient exists and belongs to this doctor
        patient_result = await db.execute(
            select(Patient).where(
                Patient.id == patient_id,
                Patient.doctor_id == current_doctor.id
            )
        )
        patient = patient_result.scalars().first()
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Find file record
        file_result = await db.execute(
            select(attached_files).where(
                attached_files.id == file_id,
                attached_files.patient_id == patient_id
            )
        )
        file_record = file_result.scalars().first()
        
        if not file_record:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Delete from Cloudinary if the path is a Cloudinary URL
        try:
            file_url = file_record.file_path
            if "cloudinary.com" in file_url:
                parts = file_url.split("/upload/")
                if len(parts) == 2:
                    public_id_with_ext = parts[1].split("/", 1)[-1]
                    public_id = os.path.splitext(public_id_with_ext)[0]
                    resource_type = "image" if file_record.file_type.startswith("image/") else "raw"
                    cloudinary.uploader.destroy(public_id, resource_type=resource_type)
        except Exception as e:
            print(f"Warning: Failed to delete file from Cloudinary: {e}")
        
        # Delete database record with both ORM and raw SQL
        try:
            # Method 1: ORM deletion
            db.delete(file_record)
            await db.flush()
            print(f"DEBUG: Database record flushed")
            await db.commit()
            print(f"DEBUG: Database record deleted and committed")
            
            # Method 2: Raw SQL deletion as backup
            from sqlalchemy import text
            raw_delete = await db.execute(
                text("DELETE FROM attached_files WHERE id = :file_id AND patient_id = :patient_id"),
                {"file_id": file_id, "patient_id": patient_id}
            )
            await db.commit()
            print(f"DEBUG: Raw SQL delete executed, rows affected: {raw_delete.rowcount}")
            
        except Exception as delete_error:
            print(f"DEBUG: Error during deletion: {delete_error}")
            await db.rollback()
            raise delete_error
        
        # Verify deletion
        verify_result = await db.execute(
            select(attached_files).where(attached_files.id == file_id)
        )
        verify_file = verify_result.scalars().first()
        if verify_file:
            print(f"DEBUG: ERROR - File record still exists after deletion!")
            # Try one more time with force
            force_delete = await db.execute(
                text("DELETE FROM attached_files WHERE id = :file_id"),
                {"file_id": file_id}
            )
            await db.commit()
            print(f"DEBUG: Force delete executed, rows affected: {force_delete.rowcount}")
        else:
            print(f"DEBUG: SUCCESS - File record properly deleted")
        
        return {"message": "File deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete file")

# Refresh patient files cache
@router.post("/{patient_id}/files/refresh")
async def refresh_patient_files(
    patient_id: int,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
) -> dict:
    try:
        print(f"DEBUG: Refreshing files cache for patient {patient_id}")

        # Verify the patient belongs to this doctor
        patient_result = await db.execute(
            select(Patient).where(
                Patient.id == patient_id,
                Patient.doctor_id == current_doctor.id
            )
        )
        if not patient_result.scalars().first():
            raise HTTPException(status_code=404, detail="Patient not found")

        # Force a new database session to avoid any caching
        files_result = await db.execute(
            select(attached_files).where(attached_files.patient_id == patient_id)
        )
        files = files_result.scalars().all()
        
        file_ids = [file.id for file in files]
        print(f"DEBUG: Refresh found files with IDs: {file_ids}")
        
        return {"message": "Cache refreshed", "file_count": len(files), "file_ids": file_ids}
    except Exception as e:
        print(f"DEBUG: Error in refresh: {e}")
        raise HTTPException(status_code=500, detail="Failed to refresh files")

# ... (rest of the code remains the same)

#prescription generation
@router.post("/{patient_id}/prescriptions", response_model=PrescriptionResponse)
async def generate_prescription(
    patient_id: int,
    prescription_data: dict,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
) -> PrescriptionResponse:
    query = select(Patient).where(
        Patient.id == patient_id,
        Patient.doctor_id == current_doctor.id
    )
    result = await db.execute(query)
    patient = result.scalars().first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # calculate the age of the patient based on the date of birth
    age = (
        datetime.now().year - patient.date_of_birth.year
        if patient.date_of_birth
        else 0
    )
    
    return(PrescriptionResponse(
        patient_name=patient.full_name,
        patient_age=age,
        patient_gender=patient.gender
    ))

# Search patient by phone number
@router.get("/search/by-phone", response_model=List[PatientResponse])
async def search_patient_by_phone(
    phone: str,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
) -> List[PatientResponse]:
    try:
        # Search only within this doctor's own patients
        result = await db.execute(
            select(Patient).where(
                Patient.phone.ilike(f"%{phone}%"),
                Patient.doctor_id == current_doctor.id
            )
        )
        patients = result.scalars().all()
        
        return [PatientResponse.from_orm(patient) for patient in patients]
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to search patients by phone")
