import uuid
from typing import List, Optional

from models import ATSEvaluation, ExtractedSkillInfo, ResumeFile, ResumeMatchScore
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select


class SQLAlchemyResumeRepository:
    """SQLAlchemy implementation of Resume Intelligence database access."""
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, id: uuid.UUID) -> Optional[ResumeFile]:
        stmt = select(ResumeFile).where(ResumeFile.id == id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_candidate(self, candidate_id: uuid.UUID) -> List[ResumeFile]:
        stmt = select(ResumeFile).where(ResumeFile.candidate_id == candidate_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_ats_evaluation(self, resume_file_id: uuid.UUID, job_id: uuid.UUID) -> Optional[ATSEvaluation]:
        stmt = select(ATSEvaluation).where(
            ATSEvaluation.resume_file_id == resume_file_id,
            ATSEvaluation.job_id == job_id
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def add_extracted_skills(self, resume_file_id: uuid.UUID, skills: List[dict]) -> None:
        """Appends parsed skills list to database."""
        for skill in skills:
            record = ExtractedSkillInfo(
                resume_file_id=resume_file_id,
                skill_name=skill["name"],
                proficiency_rating=skill.get("proficiency", "intermediate"),
                years_used=skill.get("years", 1.0)
            )
            self.session.add(record)

    async def add_match_score(self, resume_file_id: uuid.UUID, job_id: uuid.UUID, score: float, explanation: str) -> ResumeMatchScore:
        record = ResumeMatchScore(
            resume_file_id=resume_file_id,
            job_id=job_id,
            semantic_similarity=score,
            explanation_text=explanation
        )
        self.session.add(record)
        return record

    async def save(self) -> None:
        await self.session.flush()
