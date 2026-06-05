from pydantic import BaseModel, EmailStr
from typing import Optional, List
import datetime

# Helper functions for comma-separated data
def process_comma_separated_field(field_value: list[str] | str | None) -> str:
    """Convert list or string to comma-separated string for storage"""
    if not field_value:
        return ""
    
    if isinstance(field_value, list):
        return ", ".join([item.strip() for item in field_value if item.strip()])
    
    return str(field_value)

def parse_comma_separated_field(field_value: str | None) -> list[str]:
    """Convert comma-separated string to list for display"""
    if not field_value:
        return []
    
    return [item.strip() for item in field_value.split(',') if item.strip()]

# Base schemas
class PatientBase(BaseModel):
    full_name: str
    gender: Optional[str] = None
    email: EmailStr
    phone: str
    address:Optional[str] = None
    amount_paid: Optional[int] = None
    date_of_birth: Optional[datetime.date] = None
    blood_type: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    relationship_status: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    last_visit: Optional[datetime.date] = None
    next_appointment: Optional[datetime.date] = None

# Create schemas
class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    gender: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    amount_paid: Optional[int] = None
    date_of_birth: Optional[datetime.date] = None
    blood_type: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    relationship_status: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    last_visit: Optional[datetime.date] = None
    next_appointment: Optional[datetime.date] = None

# Response schemas
class PatientResponse(BaseModel):
    id: int
    full_name: str
    name: str  # same as full_name — matches common frontend naming
    age: int
    gender: Optional[str] = None
    phone: str
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    date_of_birth: Optional[datetime.date] = None
    blood_type: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    relationship_status: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    last_visit: Optional[datetime.date] = None
    amount_paid: Optional[int] = None

    @classmethod
    def from_orm(cls, patient):
        # Calculate age from date_of_birth
        age = 0
        if hasattr(patient, 'date_of_birth') and patient.date_of_birth:
            age = datetime.datetime.now().year - patient.date_of_birth.year

        fn = patient.full_name
        data = {
            'id': patient.id,
            'full_name': fn,
            'name': fn,
            'age': age,
            'gender': getattr(patient, 'gender', None),
            'phone': patient.phone,
            'email': getattr(patient, 'email', None),
            'address': getattr(patient, 'address', None),
            'date_of_birth': getattr(patient, 'date_of_birth', None),
            'blood_type': getattr(patient, 'blood_type', None),
            'allergies': getattr(patient, 'allergies', None),
            'chronic_conditions': getattr(patient, 'chronic_conditions', None),
            'relationship_status': getattr(patient, 'relationship_status', None),
            'emergency_contact_name': getattr(patient, 'emergency_contact_name', None),
            'emergency_contact_phone': getattr(patient, 'emergency_contact_phone', None),
            'last_visit': getattr(patient, 'last_visit', None),
            'amount_paid': getattr(patient, 'amount_paid', None),
        }
        return cls(**data)

    


# Search filters schema
class PatientSearchFilters(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None

# Attached files schemas
class AttachedFileBase(BaseModel):
    file_name: str
    file_path: str

class AttachedFileCreate(AttachedFileBase):
    patient_id: int

class AttachedFileResponse(AttachedFileBase):
    id: int
    patient_id: int
    file_name: str
    file_path: str
    file_type: str
    created_at: Optional[str] = None
    
    class Config:
        from_attributes = True  # Pydantic v2: replaces orm_mode
    
    @classmethod
    def from_orm(cls, attached_file):
        return cls(
            id=attached_file.id,
            patient_id=attached_file.patient_id,
            file_name=attached_file.file_name,
            file_path=attached_file.file_path,
            file_type=attached_file.file_type,
            created_at=attached_file.created_at.isoformat() if attached_file.created_at else None
        )

class PatientWithAttachedFiles(PatientResponse):
    attached_files: List[AttachedFileResponse] = []


# Patient summary 
class PatientSummary(BaseModel):
    id: int
    full_name: str
    age: int
    date_of_birth: Optional[datetime.date] = None
    email: EmailStr
    phone: str
    gender: str
    blood_type: Optional[str] = None
    
    @property
    def name(self) -> str:
        return self.full_name
    
    class Config:
        orm_mode = True



#prescription schemas
class PrescriptionResponse(BaseModel):
    patient_name: str
    patient_age: int
    patient_gender: str

