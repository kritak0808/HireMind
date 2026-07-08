from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class OrganizationBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    domain_lock: Optional[str] = None

class OrganizationCreate(OrganizationBase):
    pass

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: str
    last_name: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class JobCreate(BaseModel):
    title: str = Field(..., min_length=3)
    description: str
    hiring_manager_id: Optional[str] = None
