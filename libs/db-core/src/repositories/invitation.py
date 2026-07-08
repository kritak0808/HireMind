from typing import List, Optional, Protocol
from uuid import UUID

from models import OrganizationInvitation
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from .base import BaseRepository


class InvitationRepository(BaseRepository[OrganizationInvitation], Protocol):
    async def get_by_token(self, token: str) -> Optional[OrganizationInvitation]:
        ...

class SQLAlchemyInvitationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, id: UUID) -> Optional[OrganizationInvitation]:
        result = await self.session.execute(select(OrganizationInvitation).where(OrganizationInvitation.id == id))
        return result.scalar_one_or_none()

    async def get_by_token(self, token: str) -> Optional[OrganizationInvitation]:
        stmt = select(OrganizationInvitation).where(
            OrganizationInvitation.token == token,
            OrganizationInvitation.status == "pending"
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def add(self, entity: OrganizationInvitation) -> None:
        self.session.add(entity)

    async def delete(self, entity: OrganizationInvitation) -> None:
        await self.session.delete(entity)

    async def list_all(self) -> List[OrganizationInvitation]:
        result = await self.session.execute(select(OrganizationInvitation))
        return list(result.scalars().all())

    async def save(self) -> None:
        await self.session.flush()
