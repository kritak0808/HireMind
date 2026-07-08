import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base_model import Base, TenantModelMixin


class CopilotSession(Base, TenantModelMixin):
    __tablename__ = "copilot_sessions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    recruiter_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    messages: Mapped[list["ConversationHistory"]] = relationship(back_populates="session", cascade="all, delete-orphan")

class ConversationHistory(Base):
    __tablename__ = "copilot_conversations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("copilot_sessions.id", ondelete="CASCADE"), nullable=False)
    sender_role: Mapped[str] = mapped_column(String(50), nullable=False) # 'recruiter', 'copilot'
    message_content: Mapped[str] = mapped_column(Text, nullable=False)
    intent_detected: Mapped[str] = mapped_column(String(100), nullable=True) # e.g. 'find_candidates'
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    session: Mapped[CopilotSession] = relationship(back_populates="messages")

class WorkflowExecution(Base, TenantModelMixin):
    __tablename__ = "copilot_workflow_executions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("copilot_sessions.id", ondelete="CASCADE"), nullable=False)
    workflow_type: Mapped[str] = mapped_column(String(100), nullable=False) # 'bulk_email', 'transition_stage'
    parameters_payload: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(50), default="pending") # 'pending', 'executing', 'completed'
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class AutomationRule(Base, TenantModelMixin):
    __tablename__ = "copilot_automation_rules"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    event_trigger: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. 'resume.parsed'
    condition_payload: Mapped[dict] = mapped_column(JSON, default=dict)
    action_type: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. 'send_invitation'
    action_payload: Mapped[dict] = mapped_column(JSON, default=dict)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class DecisionRecord(Base, TenantModelMixin):
    __tablename__ = "copilot_decision_records"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    candidate_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("candidate_profiles.id", ondelete="CASCADE"), nullable=False)
    evidence_payload: Mapped[dict] = mapped_column(JSON, default=dict) # Aggregated test results, similarities
    recruiter_notes: Mapped[str] = mapped_column(Text, nullable=True)
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
