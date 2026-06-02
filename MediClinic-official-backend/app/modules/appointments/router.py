from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError
from app.db import get_db
from .models import Appointment
from .schemas import AppointmentCreate
from app.modules.patients.models import Patient
from app.modules.auth.service import get_current_doctor
from app.modules.auth.models import Doctor
from datetime import datetime
from typing import Optional

router = APIRouter(tags=["appointments"])

# Create appointment with minimal patient data and store in database
@router.post("/create")
async def create_appointment(
    appointment: AppointmentCreate,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    try:
        patient = None
        if appointment.patient_id:
            result = await db.execute(
                select(Patient).where(
                    Patient.id == appointment.patient_id,
                    Patient.doctor_id == current_doctor.id
                )
            )
            patient = result.scalars().first()

        if not patient:
            patient_result = await db.execute(
                select(Patient).where(
                    Patient.phone == appointment.phone_number,
                    Patient.doctor_id == current_doctor.id
                )
            )
            patient = patient_result.scalars().first()

        current_date = datetime.utcnow().date()
        if not patient:
            patient = Patient(
                full_name=appointment.patient_name,
                phone=appointment.phone_number,
                doctor_id=current_doctor.id,
                created_at=current_date,
                updated_at=current_date
            )
            db.add(patient)
            await db.flush()
        else:
            if not patient.full_name:
                patient.full_name = appointment.patient_name
            if not patient.phone:
                patient.phone = appointment.phone_number
            patient.updated_at = current_date

        # Check if patient has an appointment at the same time and date
        existing_result = await db.execute(
            select(Appointment).where(
                Appointment.patient_id == patient.id,
                Appointment.date == appointment.date,  # NEW: Check date too
                Appointment.time == appointment.time
            )
        )
        existing_appointment = existing_result.scalars().first()
        if existing_appointment:
            return {"message": "Patient already has an appointment at this time"}

        new_appointment = Appointment(
            patient_id=patient.id,
            doctor_id=current_doctor.id,
            date=appointment.date,  # NEW: Add date field
            time=appointment.time,
            duration=appointment.duration,
            type=appointment.type,
            payment_amount=appointment.payment_amount or 0  # Add payment_amount
        )

        db.add(new_appointment)
        await db.commit()
        await db.refresh(new_appointment)
        return {
            "message": "Appointment created successfully",
            "appointment_id": new_appointment.id,
            "patient_id": patient.id,
        }
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(
            status_code=503,
            detail="Database error while creating the appointment. Check that PostgreSQL is running and the schema matches the models.",
        )


#get all the appointments 
@router.get("/all")
async def get_appointments(
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    try:
        # Join with patients table to get patient name and phone
        result = await db.execute(
            select(Appointment, Patient)
            .join(Patient, Appointment.patient_id == Patient.id)
            .where(Appointment.doctor_id == current_doctor.id)
        )
        
        # Format results to include patient info
        appointments_with_patient = []
        for appointment, patient in result:
            appointments_with_patient.append({
                "id": appointment.id,
                "patient_id": appointment.patient_id,
                "patient_name": patient.full_name,
                "phone_number": patient.phone,
                "date": appointment.date,
                "time": appointment.time,
                "type": appointment.type,
                "duration": appointment.duration,
                "payment_amount": appointment.payment_amount
            })
        
        return appointments_with_patient
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching all appointments: {str(e)}")

#get appointments for a specific date
@router.get("/date/{date}")
async def get_appointments_by_date(
    date: str,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    try:
        # Convert string to date object for proper comparison
        from datetime import datetime
        date_obj = datetime.strptime(date, "%Y-%m-%d").date()

        # Join with patients table to get patient name and phone
        result = await db.execute(
            select(Appointment, Patient)
            .join(Patient, Appointment.patient_id == Patient.id)
            .where(
                Appointment.date == date_obj,
                Appointment.doctor_id == current_doctor.id
            )
        )
        
        # Format results to include patient info
        appointments_with_patient = []
        for appointment, patient in result:
            appointments_with_patient.append({
                "id": appointment.id,
                "patient_id": appointment.patient_id,
                "patient_name": patient.full_name,
                "phone_number": patient.phone,
                "date": appointment.date,
                "time": appointment.time,
                "type": appointment.type,
                "duration": appointment.duration,
                "payment_amount": appointment.payment_amount
            })
        
        return appointments_with_patient
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching appointments for date {date}: {str(e)}")


#update an appointment by id
@router.patch("/{appointment_id}")
async def update_appointment(
    appointment_id: int,
    date: Optional[str] = Body(None, description="New date for appointment (YYYY-MM-DD)"),
    time: Optional[str] = Body(None, description="New time for appointment (HH:MM)"),
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    # Build appointment_data dict from body parameters
    appointment_data = {}
    if date is not None:
        appointment_data['date'] = date
    if time is not None:
        appointment_data['time'] = time
    try:
        print(f"DEBUG: Updating appointment {appointment_id} with data: {appointment_data}")

        # Get existing appointment (only if it belongs to this doctor)
        result = await db.execute(
            select(Appointment).where(
                Appointment.id == appointment_id,
                Appointment.doctor_id == current_doctor.id
            )
        )
        appointment = result.scalar_one_or_none()
        
        if appointment is None:
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        print(f"DEBUG: Found appointment: date={appointment.date}, time={appointment.time}")
        
        # Check if there's already an appointment at the new time (excluding this appointment)
        if 'date' in appointment_data and 'time' in appointment_data:
            # Convert string date to date object for proper comparison
            from datetime import datetime
            new_date = datetime.strptime(appointment_data['date'], '%Y-%m-%d').date()
            
            existing_result = await db.execute(
                select(Appointment).where(
                    Appointment.patient_id == appointment.patient_id,
                    Appointment.date == new_date,
                    Appointment.time == appointment_data['time'],
                    Appointment.id != appointment_id  # Exclude current appointment
                )
            )
            existing_appointment = existing_result.scalars().first()
            if existing_appointment:
                return {"message": "Patient already has an appointment at this time"}
        
        # Update appointment fields
        if 'date' in appointment_data:
            print(f"DEBUG: Updating date from {appointment.date} to {appointment_data['date']}")
            try:
                # Parse date to ensure it's valid
                from datetime import datetime
                parsed_date = datetime.strptime(appointment_data['date'], '%Y-%m-%d').date()
                appointment.date = parsed_date
                print(f"DEBUG: Successfully parsed date: {parsed_date}")
            except ValueError as date_error:
                print(f"DEBUG: Date parsing error: {date_error}")
                raise HTTPException(status_code=400, detail=f"Invalid date format: {appointment_data['date']}. Use YYYY-MM-DD format")
                
        if 'time' in appointment_data:
            print(f"DEBUG: Updating time from {appointment.time} to {appointment_data['time']}")
            appointment.time = appointment_data['time']
        
        print(f"DEBUG: Before commit - date={appointment.date}, time={appointment.time}")
        await db.commit()
        await db.refresh(appointment)
        print(f"DEBUG: After commit - date={appointment.date}, time={appointment.time}")
        
        return {"message": "Appointment updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"DEBUG: Full error details: {type(e).__name__}: {str(e)}")
        print(f"DEBUG: Error args: {e.args}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating appointment: {str(e)}")

#remove an appointment by id
@router.delete("/{appointment_id}")
async def delete_appointment(
    appointment_id: int,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    result = await db.execute(
        select(Appointment).where(
            Appointment.id == appointment_id,
            Appointment.doctor_id == current_doctor.id
        )
    )
    appointment = result.scalar_one_or_none()
    if appointment is None:
        return {"message": "Appointment not found"}
    db.delete(appointment)
    await db.commit()
    return {"message": "Appointment deleted successfully"}