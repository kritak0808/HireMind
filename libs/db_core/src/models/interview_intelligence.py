import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base_model import Base, TenantModelMixin


class InterviewPlan(Base, TenantModelMixin):
    __tablename__ = "interview_plans"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("job_postings.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    difficulty_profile: Mapped[str] = mapped_column(String(50), default="medium") # 'easy', 'medium', 'hard'
    question_distribution: Mapped[dict] = mapped_column(JSON, default=dict) # e.g. {"technical": 3, "hr": 2}
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class InterviewSessionRecord(Base, TenantModelMixin):
    __tablename__ = "interview_session_records"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    application_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    plan_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("interview_plans.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="scheduled") # 'scheduled', 'active', 'completed'
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

class GeneratedQuestion(Base):
    __tablename__ = "generated_questions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("interview_session_records.id", ondelete="CASCADE"), nullable=False)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False) # 'technical', 'behavioral'
    difficulty_level: Mapped[str] = mapped_column(String(50), nullable=False)
    sequence_number: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class CandidateResponse(Base):
    __tablename__ = "candidate_responses"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    question_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("generated_questions.id", ondelete="CASCADE"), nullable=False)
    response_text: Mapped[str] = mapped_column(Text, nullable=False)
    voice_metrics: Mapped[dict] = mapped_column(JSON, default=dict) # pauses, rates stubs
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class InterviewEvaluationRecord(Base, TenantModelMixin):
    __tablename__ = "interview_evaluations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("interview_session_records.id", ondelete="CASCADE"), nullable=False)
    technical_score: Mapped[int] = mapped_column(Integer, default=0)
    communication_score: Mapped[int] = mapped_column(Integer, default=0)
    problem_solving_score: Mapped[int] = mapped_column(Integer, default=0)
    overall_score: Mapped[int] = mapped_column(Integer, default=0)
    reasoning_summary: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class InterviewSummaryReport(Base, TenantModelMixin):
    __tablename__ = "interview_summaries"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("interview_session_records.id", ondelete="CASCADE"), nullable=False)
    executive_summary: Mapped[str] = mapped_column(Text, nullable=False)
    strengths: Mapped[dict] = mapped_column(JSON, default=dict)
    weaknesses: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
