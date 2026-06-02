from datetime import date

from sqlalchemy import Column, Integer, String, ForeignKey

from app.db import Base


def _default_expense_date() -> str:
    return date.today().isoformat()


category = [
    "clinic rent",
    "nurse salary",
    "electricity",
    "water",
    "internet",
    "medical material",
    "maintenance",
    "paper",
    "receipts",
    "office supplies",
]


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True, index=True)
    category = Column(String, index=True)
    amount = Column(Integer, nullable=False)
    description = Column(String, nullable=True)
    date = Column(String, nullable=False, default=_default_expense_date)