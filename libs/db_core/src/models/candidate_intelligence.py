import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base_model import Base, TenantModelMixin


class CandidateIntelligenceProfile(Base, TenantModelMixin):
    __tablename__ = "candidate_intelligence_profiles"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    candidate_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("candidate_profiles.id", ondelete="CASCADE"), unique=True, nullable=False)
    career_progression_score: Mapped[int] = mapped_column(Integer, default=0)
    stability_score: Mapped[int] = mapped_column(Integer, default=0)
    technical_depth_score: Mapped[int] = mapped_column(Integer, default=0)
    enrichment_payload: Mapped[dict] = mapped_column(JSON, default=dict) # Aggregated summaries, risk flags
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class RankingProfile(Base, TenantModelMixin):
    __tablename__ = "ai_ranking_profiles"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    weights: Mapped[dict] = mapped_column(JSON, default=dict) # e.g. {"skills": 0.4, "experience": 0.6}
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class RankingResult(Base, TenantModelMixin):
    __tablename__ = "ai_ranking_results"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    ranking_profile_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ai_ranking_profiles.id", ondelete="CASCADE"), nullable=False)
    candidate_id: Mapped[uuid.UUID] = mapped_column(nullable=False)  # FK removed for ranking simulation flexibility
    job_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("job_postings.id", ondelete="CASCADE"), nullable=False)
    computed_rank_score: Mapped[float] = mapped_column(Numeric(5, 2), default=0.0) # 0 to 100.00
    rank_position: Mapped[int] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class TalentPool(Base, TenantModelMixin):
    __tablename__ = "talent_pools"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    rules_payload: Mapped[dict] = mapped_column(JSON, default=dict) # Dynamic smart filter queries
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    memberships: Mapped[list["TalentPoolMembership"]] = relationship(back_populates="pool", cascade="all, delete-orphan")

class TalentPoolMembership(Base):
    __tablename__ = "talent_pool_memberships"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    pool_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("talent_pools.id", ondelete="CASCADE"), nullable=False)
    candidate_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("candidate_profiles.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    pool: Mapped[TalentPool] = relationship(back_populates="memberships")

class RecommendationReport(Base, TenantModelMixin):
    __tablename__ = "candidate_recommendations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    candidate_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("candidate_profiles.id", ondelete="CASCADE"), nullable=False)
    job_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("job_postings.id", ondelete="CASCADE"), nullable=False)
    overall_recommendation: Mapped[str] = mapped_column(String(50), nullable=False) # 'hire', 'reject', 'watch'
    strengths: Mapped[dict] = mapped_column(JSON, default=dict)
    weaknesses: Mapped[dict] = mapped_column(JSON, default=dict)
    risk_factors: Mapped[dict] = mapped_column(JSON, default=dict)
    reasoning_summary: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
