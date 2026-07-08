import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import JSON, Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base_model import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)

    # Account locking & brute force tracking
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0)
    locked_until: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    password_history: Mapped[dict] = mapped_column(JSON, default=list) # List of past hashes

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    memberships: Mapped[list["OrganizationMembership"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    candidate_profile: Mapped[Optional["CandidateProfile"]] = relationship(back_populates="user", uselist=False)
    mfa: Mapped[Optional["UserMFA"]] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    sessions: Mapped[list["UserSessionRecord"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    api_keys: Mapped[list["UserAPIKey"]] = relationship(back_populates="user", cascade="all, delete-orphan")

# Import relations type hinting strings
from .organization import OrganizationMembership
