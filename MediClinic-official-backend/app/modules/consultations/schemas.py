from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class ConsultationBase(BaseModel):
    # Basic Personal Information
    name: str
    age: str
    sex: Optional[str] = None
    weight: Optional[str] = None
    height: Optional[str] = None
    contact: Optional[str] = None
    
    # Main Complaint
    complaint: str
    
    # History of the problem
    when_started: Optional[str] = None
    how_often: Optional[str] = None
    getting_better: Optional[str] = None
    triggers: Optional[str] = None
    makes_better: Optional[str] = None
    
    # Current Medications
    medications: Optional[str] = None
    
    # Symptoms Checklist
    fever: bool = False
    pain: bool = False
    nausea: bool = False
    cough: bool = False
    dizziness: bool = False
    fatigue: bool = False
    
    # Medical History
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    surgeries: Optional[str] = None
    
    # Family Medical History
    family_history: Optional[str] = None

    # Procedures
    diagnostic_procedures: Optional[List[str]] = []
    therapeutic_procedures: Optional[List[str]] = []

    # Consultation Details
    diagnosis: Optional[str] = None
    date: datetime
    doctor: str

class ConsultationCreate(ConsultationBase):
    patient_id: int

class ConsultationUpdate(BaseModel):
    # Basic Personal Information
    name: Optional[str] = None
    age: Optional[str] = None
    sex: Optional[str] = None
    weight: Optional[str] = None
    height: Optional[str] = None
    contact: Optional[str] = None
    
    # Main Complaint
    complaint: Optional[str] = None
    
    # History of the problem
    when_started: Optional[str] = None
    how_often: Optional[str] = None
    getting_better: Optional[str] = None
    triggers: Optional[str] = None
    makes_better: Optional[str] = None
    
    # Current Medications
    medications: Optional[str] = None
    
    # Symptoms Checklist
    fever: Optional[bool] = None
    pain: Optional[bool] = None
    nausea: Optional[bool] = None
    cough: Optional[bool] = None
    dizziness: Optional[bool] = None
    fatigue: Optional[bool] = None
    
    # Medical History
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    surgeries: Optional[str] = None
    
    # Family Medical History
    family_history: Optional[str] = None

    # Procedures
    diagnostic_procedures: Optional[List[str]] = None
    therapeutic_procedures: Optional[List[str]] = None

    # Consultation Details
    diagnosis: Optional[str] = None
    date: Optional[datetime] = None
    doctor: Optional[str] = None

class ConsultationResponse(BaseModel):
    id: int
    patient_id: int
    name: str
    age: str
    sex: Optional[str] = None
    weight: Optional[str] = None
    height: Optional[str] = None
    contact: Optional[str] = None
    complaint: str
    when_started: Optional[str] = None
    how_often: Optional[str] = None
    getting_better: Optional[str] = None
    triggers: Optional[str] = None
    makes_better: Optional[str] = None
    medications: Optional[str] = None
    fever: bool = False
    pain: bool = False
    nausea: bool = False
    cough: bool = False
    dizziness: bool = False
    fatigue: bool = False
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    surgeries: Optional[str] = None
    family_history: Optional[str] = None
    diagnostic_procedures: Optional[List[str]] = []
    therapeutic_procedures: Optional[List[str]] = []
    diagnosis: Optional[str] = None
    date: datetime
    doctor: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
