import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base_model import Base, TenantModelMixin


class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), unique=True, nullable=True)
    phone_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    resumes: Mapped[list["ResumeVersion"]] = relationship(back_populates="candidate", cascade="all, delete-orphan")
    user: Mapped[Optional["User"]] = relationship(back_populates="candidate_profile")

    # Back-populating references for recruitment context
    notes: Mapped[list["CandidateNote"]] = relationship(back_populates="candidate", cascade="all, delete-orphan")
    timeline_events: Mapped[list["CandidateTimelineEvent"]] = relationship(back_populates="candidate", cascade="all, delete-orphan")

class ResumeVersion(Base):
    __tablename__ = "resume_versions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    candidate_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("candidate_profiles.id", ondelete="CASCADE"), nullable=False)
    s3_key: Mapped[str] = mapped_column(String(512), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    candidate: Mapped[CandidateProfile] = relationship(back_populates="resumes")
    analysis: Mapped[Optional["ResumeAnalysis"]] = relationship(back_populates="resume", uselist=False, cascade="all, delete-orphan")

class ResumeAnalysis(Base):
    __tablename__ = "resume_analyses"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    resume_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("resume_versions.id", ondelete="CASCADE"), unique=True, nullable=False)
    skills: Mapped[dict] = mapped_column(JSON, default=dict) # JSON GIN indexed skills list
    experience_years: Mapped[float] = mapped_column(default=0.0)
    employment_gaps: Mapped[dict] = mapped_column(JSON, default=dict)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    resume: Mapped[ResumeVersion] = relationship(back_populates="analysis")

class Application(Base, TenantModelMixin):
    __tablename__ = "applications"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("job_postings.id", ondelete="CASCADE"), nullable=False)
    candidate_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("candidate_profiles.id", ondelete="CASCADE"), nullable=False)
    current_stage: Mapped[str] = mapped_column(String(50), nullable=False) # 'screening', 'coding', 'hr'
    stage_status: Mapped[str] = mapped_column(String(50), default="pending") # 'pending', 'in_progress', 'passed', 'rejected'
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    sessions: Mapped[list["InterviewSession"]] = relationship(back_populates="application", cascade="all, delete-orphan")

# Import definitions to satisfy relationship compilation
from .notes import CandidateNote
from .timeline import CandidateTimelineEvent
