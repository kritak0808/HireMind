import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base_model import Base


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    application_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    session_type: Mapped[str] = mapped_column(String(50), nullable=False) # 'voice_technical', 'coding_arena', 'voice_hr'
    status: Mapped[str] = mapped_column(String(50), default="scheduled") # 'scheduled', 'active', 'completed', 'expired'
    webrtc_room_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    application: Mapped["Application"] = relationship(back_populates="sessions")
    transcripts: Mapped[list["TranscriptChunk"]] = relationship(back_populates="session", cascade="all, delete-orphan")
    submissions: Mapped[list["CodingSubmission"]] = relationship(back_populates="session", cascade="all, delete-orphan")

class TranscriptChunk(Base):
    __tablename__ = "interview_transcripts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False)
    speaker: Mapped[str] = mapped_column(String(50), nullable=False) # 'candidate', 'agent_interviewer'
    text_content: Mapped[str] = mapped_column(Text, nullable=False)
    timestamp_offset: Mapped[int] = mapped_column(Integer, nullable=False) # Milliseconds from start
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    session: Mapped[InterviewSession] = relationship(back_populates="transcripts")

class CodingSubmission(Base):
    __tablename__ = "coding_submissions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False)
    code_content: Mapped[str] = mapped_column(Text, nullable=False)
    programming_language: Mapped[str] = mapped_column(String(50), nullable=False)
    execution_status: Mapped[str] = mapped_column(String(50), nullable=False) # 'success', 'compile_error', 'runtime_error', 'timeout'
    telemetry_logs: Mapped[dict] = mapped_column(JSON, default=dict) # focus losts, keystroke delays
    performance_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    session: Mapped[InterviewSession] = relationship(back_populates="submissions")
