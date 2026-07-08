import uuid
from typing import List, Optional

from models import CandidateIntelligenceProfile, RankingResult, RecommendationReport, TalentPool
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select


class SQLAlchemyCandidateIntelligenceRepository:
    """SQLAlchemy implementation of Candidate Intelligence database access."""
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_profile_by_candidate(self, candidate_id: uuid.UUID) -> Optional[CandidateIntelligenceProfile]:
        stmt = select(CandidateIntelligenceProfile).where(
            CandidateIntelligenceProfile.candidate_id == candidate_id
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_talent_pools(self, organization_id: uuid.UUID) -> List[TalentPool]:
        stmt = select(TalentPool).where(TalentPool.organization_id == organization_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_recommendation(self, candidate_id: uuid.UUID, job_id: uuid.UUID) -> Optional[RecommendationReport]:
        stmt = select(RecommendationReport).where(
            RecommendationReport.candidate_id == candidate_id,
            RecommendationReport.job_id == job_id
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def save_ranking_results(self, org_id: str, ranking_profile_id: uuid.UUID, job_id: uuid.UUID, results: List[dict]) -> None:
        """Saves calculated ranks and sorting numbers for candidate list."""
        for res in results:
            record = RankingResult(
                organization_id=org_id,
                ranking_profile_id=ranking_profile_id,
                candidate_id=res["candidate_id"],
                job_id=job_id,
                computed_rank_score=res["score"],
                rank_position=res["position"]
            )
            self.session.add(record)

    async def save(self) -> None:
        await self.session.flush()
