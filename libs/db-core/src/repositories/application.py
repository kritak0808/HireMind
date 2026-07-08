from typing import List, Optional, Protocol
from uuid import UUID

from models import Application
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from .base import BaseRepository


class ApplicationRepository(BaseRepository[Application], Protocol):
    """ApplicationRepository interface handling pipeline aggregates."""
    async def get_by_candidate_and_job(self, candidate_id: UUID, job_id: UUID) -> Optional[Application]:
        ...

    async def list_by_stage(self, organization_id: UUID, stage: str) -> List[Application]:
        ...

    async def update_pipeline_stage(self, application_id: UUID, stage: str, status: str) -> None:
        ...

class SQLAlchemyApplicationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, id: UUID) -> Optional[Application]:
        result = await self.session.execute(select(Application).where(Application.id == id))
        return result.scalar_one_or_none()

    async def add(self, entity: Application) -> None:
        self.session.add(entity)

    async def delete(self, entity: Application) -> None:
        await self.session.delete(entity)

    async def list_all(self) -> List[Application]:
        result = await self.session.execute(select(Application))
        return list(result.scalars().all())

    async def get_by_candidate_and_job(self, candidate_id: UUID, job_id: UUID) -> Optional[Application]:
        stmt = select(Application).where(
            Application.candidate_id == candidate_id,
            Application.job_id == job_id
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_stage(self, organization_id: UUID, stage: str) -> List[Application]:
        stmt = select(Application).where(
            Application.organization_id == organization_id,
            Application.current_stage == stage
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update_pipeline_stage(self, application_id: UUID, stage: str, status: str) -> None:
        await self.session.execute(
            update(Application)
            .where(Application.id == application_id)
            .values(current_stage=stage, stage_status=status)
        )

    async def save(self) -> None:
        await self.session.flush()
