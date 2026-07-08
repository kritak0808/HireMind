from typing import Generic, List, Optional, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")

class PaginationMetadata(BaseModel):
    current_page: int = Field(..., description="1-based active page index")
    limit: int = Field(..., description="Max items per page index limit")
    total_pages: int
    total_count: int
    has_next: bool
    has_prev: bool

class PaginatedEnvelope(BaseModel, Generic[T]):
    data: List[T]
    metadata: PaginationMetadata

class ErrorDetail(BaseModel):
    field: Optional[str] = None
    issue: str

class ErrorEnvelope(BaseModel):
    code: str
    message: str
    request_id: str
    details: List[ErrorDetail] = Field(default_factory=list)
