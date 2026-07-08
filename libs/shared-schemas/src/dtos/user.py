from pydantic import BaseModel, EmailStr, Field


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Minimum 8 characters password")
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)

class UserProfileResponse(BaseModel):
    id: str
    email: EmailStr
    first_name: str
    last_name: str
    is_active: bool
    created_at: str
