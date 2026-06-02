from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date
from typing import Optional

from app.db import get_db
from app.modules.patients.models import Patient
from app.modules.appointments.models import Appointment
from app.modules.consultations.models import Consultation
from app.modules.auth.service import get_current_doctor
from app.modules.auth.models import Doctor
from .schemas import (
    DashboardStatsResponse,
    DashboardAppointmentItem,
    DashboardRecentPatient,
    DashboardOverviewResponse,
)

router = APIRouter()


def _patient_age(patient: Patient) -> int:
    if not patient.date_of_birth:
        return 0
    return date.today().year - patient.date_of_birth.year


@router.get("/overview", response_model=DashboardOverviewResponse)
async def get_dashboard_overview(
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
):
    """Dashboard overview backed by Patient, Appointment, and Consultation tables."""
    doctor_id = current_doctor.id
    today_d = date.today()
    today_prefix = today_d.isoformat()
    first_of_month = today_d.replace(day=1)

    total_patients = (
        await db.execute(
            select(func.count(Patient.id)).where(Patient.doctor_id == doctor_id)
        )
    ).scalar_one() or 0

    consultations_total = (
        await db.execute(
            select(func.count(Consultation.id)).where(Consultation.doctor_id == doctor_id)
        )
    ).scalar_one() or 0

    today_appt_count = (
        await db.execute(
            select(func.count(Appointment.id))
            .where(Appointment.doctor_id == doctor_id)
            .where(Appointment.time.like(f"{today_prefix}%"))
        )
    ).scalar_one() or 0

    active_patients = (
        await db.execute(
            select(func.count(Patient.id))
            .where(Patient.doctor_id == doctor_id)
            .where(Patient.last_visit.isnot(None))
        )
    ).scalar_one() or 0

    new_patients_this_month = (
        await db.execute(
            select(func.count(Patient.id))
            .where(Patient.doctor_id == doctor_id)
            .where(Patient.created_at >= first_of_month)
        )
    ).scalar_one() or 0

    stats = DashboardStatsResponse(
        total_patients=total_patients,
        today_appointments=today_appt_count,
        pending_payments=0.0,
        consultations=consultations_total,
        total_revenue=0.0,
        monthly_revenue=0.0,
        active_patients=active_patients,
        new_patients_this_month=new_patients_this_month,
    )

    appt_result = await db.execute(
        select(Appointment)
        .where(Appointment.doctor_id == doctor_id)
        .where(Appointment.time.like(f"{today_prefix}%"))
        .order_by(Appointment.time)
        .options(selectinload(Appointment.patient))
    )
    appt_rows = appt_result.scalars().all()
    today_appointments = [
        DashboardAppointmentItem(
            id=a.id,
            patient_id=a.patient_id,
            time=a.time,
            duration=a.duration,
            appointment_type=a.type,
            type=a.type,
            patient_name=a.patient.full_name if a.patient else None,
        )
        for a in appt_rows
    ]

    recent_result = await db.execute(
        select(Patient)
        .where(Patient.doctor_id == doctor_id)
        .order_by(Patient.updated_at.desc(), Patient.id.desc())
        .limit(5)
    )
    recent_rows = recent_result.scalars().all()
    recent_patients = [
        DashboardRecentPatient(
            id=p.id,
            full_name=p.full_name,
            name=p.full_name,
            phone=p.phone,
            email=p.email,
            gender=p.gender,
            age=_patient_age(p),
        )
        for p in recent_rows
    ]

    return DashboardOverviewResponse(
        doctor_id=doctor_id,
        stats=stats,
        today_appointments=today_appointments,
        recent_patients=recent_patients,
    )
