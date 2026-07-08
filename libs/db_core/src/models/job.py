import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base_model import Base, TenantModelMixin


class JobPosting(Base, TenantModelMixin):
    __tablename__ = "job_postings"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="draft") # 'draft', 'open', 'closed'
    salary_range: Mapped[Optional[str]] = mapped_column(String(255), nullable=True) # e.g. '$120,000 - $180,000'
    hiring_manager_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    skills: Mapped[list["SkillRequirement"]] = relationship(back_populates="job", cascade="all, delete-orphan")
    stages: Mapped[list["PipelineStage"]] = relationship(back_populates="job", cascade="all, delete-orphan")

class SkillRequirement(Base):
    __tablename__ = "skill_requirements"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("job_postings.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    weight: Mapped[float] = mapped_column(default=1.0) # Importance multiplier
    target_tier: Mapped[str] = mapped_column(String(50)) # 'junior', 'mid', 'senior'

    job: Mapped[JobPosting] = relationship(back_populates="skills")

class PipelineStage(Base):
    __tablename__ = "pipeline_stages"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("job_postings.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False) # 'screening', 'coding', 'hr'
    sequence_order: Mapped[int] = mapped_column(nullable=False)

    job: Mapped[JobPosting] = relationship(back_populates="stages")
