from sqlalchemy import Column, Integer, String, Date, ForeignKey, Enum, Float
from sqlalchemy.orm import relationship
from app.db import Base
from datetime import datetime

    

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    date = Column(Date, nullable=False)  # NEW: Add date field
    time = Column(String, nullable=False)
    duration = Column(Integer, nullable=False)
    type = Column(String, nullable=False)
    payment_amount = Column(Float, nullable=True)


    # Foreign key relationship with the patient table
    patient = relationship("Patient", back_populates="appointments")    