import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base_model import Base, TenantModelMixin


class MediaSession(Base, TenantModelMixin):
    __tablename__ = "media_sessions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    interview_session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("interview_session_records.id", ondelete="CASCADE"), nullable=False)
    webrtc_room_id: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="negotiating") # 'negotiating', 'connected', 'disconnected'
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    streams: Mapped[list["MediaStream"]] = relationship(back_populates="session", cascade="all, delete-orphan")

class MediaStream(Base):
    __tablename__ = "media_streams"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("media_sessions.id", ondelete="CASCADE"), nullable=False)
    stream_type: Mapped[str] = mapped_column(String(50), nullable=False) # 'audio', 'video', 'screen'
    codec: Mapped[str] = mapped_column(String(50), nullable=False) # 'opus', 'vp8', 'h264'
    bitrate_kbps: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    session: Mapped[MediaSession] = relationship(back_populates="streams")

class RecordingMetadata(Base, TenantModelMixin):
    __tablename__ = "media_recordings"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("media_sessions.id", ondelete="CASCADE"), nullable=False)
    s3_key: Mapped[str] = mapped_column(String(512), nullable=False)
    duration_seconds: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)
    file_size_bytes: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class TranscriptSegment(Base):
    __tablename__ = "media_transcripts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("media_sessions.id", ondelete="CASCADE"), nullable=False)
    speaker_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    transcript_text: Mapped[str] = mapped_column(Text, nullable=False)
    start_time_offset: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False) # Offset in seconds
    end_time_offset: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    confidence: Mapped[float] = mapped_column(Numeric(4, 3), default=1.000)

class SessionQualityReport(Base, TenantModelMixin):
    __tablename__ = "media_quality_reports"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("media_sessions.id", ondelete="CASCADE"), nullable=False)
    packet_loss_percentage: Mapped[float] = mapped_column(Numeric(4, 2), default=0.00)
    jitter_ms: Mapped[int] = mapped_column(Integer, default=0)
    bandwidth_mbps: Mapped[float] = mapped_column(Numeric(6, 3), default=0.000)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
