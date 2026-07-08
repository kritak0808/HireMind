import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base_model import Base, TenantModelMixin


class CodingAssessment(Base, TenantModelMixin):
    __tablename__ = "coding_assessments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("job_postings.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    problem_description: Mapped[str] = mapped_column(Text, nullable=False)
    time_limit_seconds: Mapped[int] = mapped_column(Integer, default=30)
    memory_limit_mb: Mapped[int] = mapped_column(Integer, default=256)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class CodeSubmission(Base, TenantModelMixin):
    __tablename__ = "code_submissions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    assessment_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("coding_assessments.id", ondelete="CASCADE"), nullable=False)
    candidate_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("candidate_profiles.id", ondelete="CASCADE"), nullable=False)
    source_code: Mapped[str] = mapped_column(Text, nullable=False)
    programming_language: Mapped[str] = mapped_column(String(50), nullable=False) # 'python', 'go', 'rust'
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class ExecutionResult(Base):
    __tablename__ = "sandbox_execution_results"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    submission_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("code_submissions.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="queued") # 'passed', 'failed', 'timeout'
    stdout_output: Mapped[str] = mapped_column(Text, nullable=True)
    stderr_output: Mapped[str] = mapped_column(Text, nullable=True)
    cpu_time_used: Mapped[float] = mapped_column(Numeric(10, 4), default=0.0)
    memory_used_mb: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class ComplexityReport(Base, TenantModelMixin):
    __tablename__ = "ai_complexity_reports"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    submission_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("code_submissions.id", ondelete="CASCADE"), nullable=False)
    estimated_time_complexity: Mapped[str] = mapped_column(String(50), nullable=True) # e.g. 'O(N log N)'
    estimated_space_complexity: Mapped[str] = mapped_column(String(50), nullable=True)
    bottlenecks: Mapped[dict] = mapped_column(JSON, default=dict)
    refactoring_tips: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class PlagiarismReport(Base, TenantModelMixin):
    __tablename__ = "code_plagiarism_reports"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    submission_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("code_submissions.id", ondelete="CASCADE"), nullable=False)
    matched_submission_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("code_submissions.id", ondelete="CASCADE"), nullable=True)
    similarity_score: Mapped[float] = mapped_column(Numeric(5, 2), default=0.0) # percentage 0 to 100.00
    token_overlap_ratio: Mapped[float] = mapped_column(Numeric(5, 2), default=0.0)
    explanation_summary: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
