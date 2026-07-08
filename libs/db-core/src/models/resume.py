import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base_model import Base, TenantModelMixin


class ResumeFile(Base, TenantModelMixin):
    __tablename__ = "resume_files"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    candidate_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("candidate_profiles.id", ondelete="CASCADE"), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    s3_key: Mapped[str] = mapped_column(String(512), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    processing_status: Mapped[str] = mapped_column(String(50), default="pending") # 'pending', 'parsed', 'failed'
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class ExtractedSkillInfo(Base, TenantModelMixin):
    __tablename__ = "extracted_resume_skills"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    resume_file_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("resume_files.id", ondelete="CASCADE"), nullable=False)
    skill_name: Mapped[str] = mapped_column(String(100), nullable=False)
    proficiency_rating: Mapped[str] = mapped_column(String(50), nullable=False) # 'expert', 'intermediate'
    years_used: Mapped[float] = mapped_column(Numeric(4, 1), default=0.0)

class ATSEvaluation(Base, TenantModelMixin):
    __tablename__ = "ats_evaluations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    resume_file_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("resume_files.id", ondelete="CASCADE"), nullable=False)
    job_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("job_postings.id", ondelete="CASCADE"), nullable=False)
    score_relevance: Mapped[int] = mapped_column(Integer, default=0) # 0 to 100
    score_skills: Mapped[int] = mapped_column(Integer, default=0)
    score_formatting: Mapped[int] = mapped_column(Integer, default=0)
    overall_score: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class ResumeMatchScore(Base, TenantModelMixin):
    __tablename__ = "resume_match_scores"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    resume_file_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("resume_files.id", ondelete="CASCADE"), nullable=False)
    job_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("job_postings.id", ondelete="CASCADE"), nullable=False)
    semantic_similarity: Mapped[float] = mapped_column(Numeric(5, 4), default=0.0)
    explanation_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class ResumeImprovementReport(Base, TenantModelMixin):
    __tablename__ = "resume_improvement_reports"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    resume_file_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("resume_files.id", ondelete="CASCADE"), nullable=False)
    suggestions: Mapped[dict] = mapped_column(JSON, default=dict) # List of suggestions, action verbs, gaps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
