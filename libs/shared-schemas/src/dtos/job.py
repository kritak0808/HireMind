from typing import List, Optional

from pydantic import BaseModel, Field


class SkillRequirementDTO(BaseModel):
    name: str
    weight: float = Field(default=1.0)
    target_tier: str

class JobCreateRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str
    salary_range: Optional[str] = None
    hiring_manager_id: Optional[str] = None
    skills: List[SkillRequirementDTO] = Field(default_factory=list)

class JobResponse(BaseModel):
    id: str
    organization_id: str
    title: str
    description: str
    status: str
    created_at: str
