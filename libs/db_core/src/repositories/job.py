from typing import List, Optional, Protocol
from uuid import UUID

from models import JobPosting, SkillRequirement
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from .base import BaseRepository


class JobRepository(BaseRepository[JobPosting], Protocol):
    """JobRepository interface managing job requirements contexts."""
    async def list_by_organization(self, organization_id: UUID, status: Optional[str] = None) -> List[JobPosting]:
        ...

    async def add_skill_requirement(self, job_id: UUID, name: str, weight: float, target_tier: str) -> None:
        ...

class SQLAlchemyJobRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, id: UUID) -> Optional[JobPosting]:
        result = await self.session.execute(select(JobPosting).where(JobPosting.id == id))
        return result.scalar_one_or_none()

    async def add(self, entity: JobPosting) -> None:
        self.session.add(entity)

    async def delete(self, entity: JobPosting) -> None:
        await self.session.delete(entity)

    async def list_all(self) -> List[JobPosting]:
        result = await self.session.execute(select(JobPosting))
        return list(result.scalars().all())

    async def list_by_organization(self, organization_id: UUID, status: Optional[str] = None) -> List[JobPosting]:
        stmt = select(JobPosting).where(JobPosting.organization_id == organization_id)
        if status:
            stmt = stmt.where(JobPosting.status == status)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def add_skill_requirement(self, job_id: UUID, name: str, weight: float, target_tier: str) -> None:
        req = SkillRequirement(
            job_id=job_id,
            name=name,
            weight=weight,
            target_tier=target_tier
        )
        self.session.add(req)

    async def save(self) -> None:
        await self.session.flush()
