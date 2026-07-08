import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base_model import Base, TenantModelMixin


class CandidateTimelineEvent(Base, TenantModelMixin):
    __tablename__ = "candidate_timeline_events"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    candidate_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("candidate_profiles.id", ondelete="CASCADE"), nullable=False)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False) # 'application_submitted', 'stage_changed'
    description: Mapped[str] = mapped_column(Text, nullable=False)
    actor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    metadata_log: Mapped[dict] = mapped_column(JSON, default=dict) # correlation ID, extra parameters
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    candidate: Mapped["CandidateProfile"] = relationship(back_populates="timeline_events")
    actor: Mapped["User"] = relationship()

# Import relations mappings
from .application import CandidateProfile
from .user import User
