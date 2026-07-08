import os
import sys

# Ensure dtos/ subdir itself is in path so we can import base, user, job
_dtos_dir = os.path.dirname(os.path.abspath(__file__))
if _dtos_dir not in sys.path:
    sys.path.insert(0, _dtos_dir)

# Also add shared-schemas/src so we can import from schemas.py
_schemas_dir = os.path.normpath(os.path.join(_dtos_dir, '..'))
if _schemas_dir not in sys.path:
    sys.path.insert(0, _schemas_dir)

from base import ErrorDetail, ErrorEnvelope, PaginatedEnvelope, PaginationMetadata
from job import JobCreateRequest, JobResponse, SkillRequirementDTO
from schemas import JobCreate, OrganizationBase, OrganizationCreate, TokenResponse, UserRegister
from user import UserProfileResponse, UserRegisterRequest

__all__ = [
    "PaginationMetadata",
    "PaginatedEnvelope",
    "ErrorDetail",
    "ErrorEnvelope",
    "UserRegisterRequest",
    "UserProfileResponse",
    "SkillRequirementDTO",
    "JobCreateRequest",
    "JobResponse",
    "TokenResponse",
    "OrganizationBase",
    "OrganizationCreate",
    "UserRegister",
    "JobCreate"
]
