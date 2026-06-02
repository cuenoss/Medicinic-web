from datetime import date, datetime, timedelta
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, status
from sqlalchemy import Float, String, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.modules.appointments.models import Appointment
from app.modules.patients.models import Patient
from app.modules.auth.service import get_current_doctor
from app.modules.auth.models import Doctor
from .models import Expense
from .schemas import ExpenseCreate, ExpenseResponse, ExpenseListResponse

router = APIRouter(tags=["finance"])


def _normalize_expense_date_string(raw: str) -> str:
    """Store/compare as YYYY-MM-DD prefix for ISO-like strings."""
    if not raw:
        return date.today().isoformat()
    return raw.split("T")[0][:10]


@router.post("/expenses/", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(
    expense: ExpenseCreate,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
):
    data = expense.dict()
    data["amount"] = int(round(data["amount"]))
    data["date"] = _normalize_expense_date_string(data.get("date") or "")
    data["doctor_id"] = current_doctor.id
    new_expense = Expense(**data)
    db.add(new_expense)
    await db.commit()
    await db.refresh(new_expense)
    return new_expense


@router.get("/expenses/", response_model=ExpenseListResponse)
async def expense_stats(
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
):
    """
    Calculate revenue from appointments with payment_amount and expenses by type.
    Revenue = sum of payment_amount from appointments with payment_amount is not None
    """
    today = date.today().isoformat()

    # Calculate today's revenue from paid appointments
    result = await db.execute(
        select(func.coalesce(func.cast(func.sum(Appointment.payment_amount), Float), 0))
        .where(Appointment.doctor_id == current_doctor.id)
        .where(Appointment.payment_amount.isnot(None))
        .where(func.cast(Appointment.date, String).like(f"{today}%"))
    )
    todays_revenue = result.scalar_one() or 0

    # Calculate total revenue from all paid appointments
    result = await db.execute(
        select(func.coalesce(func.cast(func.sum(Appointment.payment_amount), Float), 0))
        .where(Appointment.doctor_id == current_doctor.id)
        .where(Appointment.payment_amount.isnot(None))
    )
    total_revenue = result.scalar_one() or 0

    # Calculate today's expenses
    result = await db.execute(
        select(func.coalesce(func.sum(Expense.amount), 0))
        .where(Expense.doctor_id == current_doctor.id)
        .where(func.cast(Expense.date, String).like(f"{today}%"))
    )
    todays_expenses = result.scalar_one() or 0

    # Calculate total expenses
    result = await db.execute(
        select(func.coalesce(func.sum(Expense.amount), 0))
        .where(Expense.doctor_id == current_doctor.id)
    )
    total_expenses = result.scalar_one() or 0

    return ExpenseListResponse(
        todays_revenue=float(todays_revenue),
        total_revenue=float(total_revenue),
        todays_expenses=float(todays_expenses),
        total_expenses=float(total_expenses),
        todays_profit=float(todays_revenue - todays_expenses),
        total_profit=float(total_revenue - total_expenses),
    )


@router.get("/overview/")
async def monthly_overview(
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
) -> Dict[str, float]:
    cutoff_date = date.today() - timedelta(days=30)

    # Calculate monthly expenses
    cutoff_str = cutoff_date.isoformat()
    result = await db.execute(
        select(func.coalesce(func.sum(Expense.amount), 0))
        .where(Expense.doctor_id == current_doctor.id)
        .where(Expense.date >= cutoff_str)
    )
    expenses = result.scalar_one() or 0

    # Calculate monthly revenue from paid appointments
    result = await db.execute(
        select(func.coalesce(func.cast(func.sum(Appointment.payment_amount), Float), 0))
        .where(Appointment.doctor_id == current_doctor.id)
        .where(Appointment.payment_amount.isnot(None))
        .where(Appointment.date >= cutoff_date)
    )
    revenue = result.scalar_one() or 0
    
    return {"revenue": float(revenue), "expenses": float(expenses)}


@router.get("/monthly-data/")
async def get_monthly_data(
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
) -> Dict[str, List[Dict[str, Any]]]:
    """Get revenue and expenses data for the past 12 months"""
    monthly_data = []
    current_date = date.today()
    
    for i in range(12):
        # Calculate the start and end date for each month
        if i == 0:
            # Current month
            month_start = current_date.replace(day=1)
            month_end = current_date
        else:
            # Previous months - calculate properly
            # Go back i months from current month
            target_month = current_date.month - i
            target_year = current_date.year
            
            # Handle year rollover
            while target_month <= 0:
                target_month += 12
                target_year -= 1
            
            month_start = date(target_year, target_month, 1)
            
            # Get last day of the month
            if target_month == 12:
                next_month = date(target_year + 1, 1, 1)
            else:
                next_month = date(target_year, target_month + 1, 1)
            month_end = next_month - timedelta(days=1)
        
        month_start_str = month_start.isoformat()
        month_end_str = month_end.isoformat()
        
        # Calculate expenses for this month
        result = await db.execute(
            select(func.coalesce(func.sum(Expense.amount), 0))
            .where(Expense.doctor_id == current_doctor.id)
            .where(Expense.date >= month_start_str)
            .where(Expense.date <= month_end_str)
        )
        expenses = result.scalar_one() or 0

        # Calculate revenue for this month
        result = await db.execute(
            select(func.coalesce(func.cast(func.sum(Appointment.payment_amount), Float), 0))
            .where(Appointment.doctor_id == current_doctor.id)
            .where(Appointment.payment_amount.isnot(None))
            .where(Appointment.date >= month_start)
            .where(Appointment.date <= month_end)
        )
        revenue = result.scalar_one() or 0
        
        monthly_data.append({
            "month": month_start.strftime("%b"),
            "revenue": float(revenue),
            "expenses": float(expenses)
        })
    
    # Reverse to show oldest to newest
    monthly_data.reverse()
    return {"monthly_data": monthly_data}


@router.get("/expenses/category/")
async def expenses_by_category(
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
) -> Dict[str, float]:
    cutoff_date = date.today() - timedelta(days=30)
    cutoff_str = cutoff_date.isoformat()
    cat_result = await db.execute(
        select(Expense.category).where(Expense.doctor_id == current_doctor.id).distinct()
    )
    categories = [row[0] for row in cat_result.all() if row[0]]

    out: Dict[str, float] = {}
    for category in categories:
        result = await db.execute(
            select(func.coalesce(func.sum(Expense.amount), 0)).where(
                Expense.doctor_id == current_doctor.id,
                Expense.category == category,
                Expense.date >= cutoff_str,
            )
        )
        total = result.scalar_one()
        out[category] = float(total or 0)
    return out


def _expense_to_dict(e: Expense) -> Dict[str, Any]:
    return {
        "id": e.id,
        "category": e.category,
        "amount": e.amount,
        "description": e.description,
        "date": e.date,
    }


@router.get("/transactions/recent/")
async def recent_transactions(
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
) -> Dict[str, List[Any]]:
    cutoff_date = date.today() - timedelta(days=3)
    cutoff_str = cutoff_date.isoformat()

    # Get recent expenses
    exp_result = await db.execute(
        select(Expense)
        .where(Expense.doctor_id == current_doctor.id)
        .where(Expense.date >= cutoff_str)
        .order_by(Expense.date.desc())
    )
    expenses = [_expense_to_dict(e) for e in exp_result.scalars().all()]

    # Get recent paid appointments as revenue
    appt_result = await db.execute(
        select(Appointment)
        .where(Appointment.doctor_id == current_doctor.id)
        .where(Appointment.payment_amount.isnot(None))
        .where(Appointment.date >= cutoff_date)
        .order_by(Appointment.date.desc())
    )
    
    # Get patient names for appointments
    patient_ids = [a.patient_id for a in appt_result.scalars().all()]
    patient_result = await db.execute(
        select(Patient).where(Patient.id.in_(patient_ids))
    )
    patients = {p.id: p.full_name for p in patient_result.scalars().all()}
    
    appointments = [
        {
            "id": a.id,
            "patient_id": a.patient_id,
            "patient_name": patients.get(a.patient_id, "Unknown Patient"),
            "date": a.date.isoformat() if a.date else "",
            "type": a.type,
            "payment_amount": a.payment_amount or 0,
        }
        for a in appt_result.scalars().all()
    ]

    return {"expenses": expenses, "appointments": appointments}
