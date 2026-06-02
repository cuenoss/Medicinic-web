from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base

class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)

    # Basic Personal Information
    name = Column(String, nullable=False)
    age = Column(String, nullable=False)
    sex = Column(String)
    weight = Column(String)
    height = Column(String)
    contact = Column(String)
    
    # Main Complaint
    complaint = Column(Text, nullable=False)
    
    # History of the problem
    when_started = Column(String)
    how_often = Column(String)
    getting_better = Column(String)
    triggers = Column(String)
    makes_better = Column(String)
    
    # Current Medications
    medications = Column(Text)
    
    # Symptoms Checklist
    fever = Column(Boolean, default=False)
    pain = Column(Boolean, default=False)
    nausea = Column(Boolean, default=False)
    cough = Column(Boolean, default=False)
    dizziness = Column(Boolean, default=False)
    fatigue = Column(Boolean, default=False)
    
    # Medical History
    allergies = Column(Text)
    chronic_conditions = Column(Text)
    surgeries = Column(Text)
    
    # Family Medical History
    family_history = Column(Text)
    
    # Consultation Details
    diagnosis = Column(Text)
    date = Column(DateTime, nullable=False)
    doctor = Column(String, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    patient = relationship("Patient", back_populates="consultations")
