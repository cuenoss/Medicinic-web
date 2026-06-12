from pydantic import BaseModel, EmailStr, root_validator
from typing import Optional



class DoctorCreate(BaseModel):
    fullName: str
    email: EmailStr
    password: str
    confirmPassword: str
    
    @root_validator(skip_on_failure=True)
    @classmethod
    def passwords_match(cls, values):
        if 'password' in values and 'confirmPassword' in values and values['password'] != values['confirmPassword']:
            raise ValueError('Passwords do not match')
        return values
    



class DoctorLogin(BaseModel):
    email: EmailStr
    password: str
    
    class Config:
        from_attributes = True

class DoctorResponse(BaseModel):
    id: int
    fullName: str
    email: EmailStr
    is_admin: bool = False

    class Config:
        from_attributes = True
    
class UserResponse(BaseModel):
    id: int
    email: str

    class Config:
        from_attributes = True
 

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    doctor: DoctorResponse
    
    class Config:
        from_attributes = True

class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr
