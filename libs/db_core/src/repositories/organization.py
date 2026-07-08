from typing import List, Optional, Protocol
from uuid import UUID

from models import Organization, OrganizationMembership
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from .base import BaseRepository


class OrganizationRepository(BaseRepository[Organization], Protocol):
    """OrganizationRepository interface managing tenant access scopes."""
    async def get_membership(self, organization_id: UUID, user_id: UUID) -> Optional[OrganizationMembership]:
        ...

    async def create_membership(self, organization_id: UUID, user_id: UUID, role: str) -> OrganizationMembership:
        ...

class SQLAlchemyOrganizationRepository:
    """SQLAlchemy implementation of OrganizationRepository."""
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, id: UUID) -> Optional[Organization]:
        result = await self.session.execute(select(Organization).where(Organization.id == id))
        return result.scalar_one_or_none()

    async def add(self, entity: Organization) -> None:
        self.session.add(entity)

    async def delete(self, entity: Organization) -> None:
        await self.session.delete(entity)

    async def list_all(self) -> List[Organization]:
        result = await self.session.execute(select(Organization))
        return list(result.scalars().all())

    async def get_membership(self, organization_id: UUID, user_id: UUID) -> Optional[OrganizationMembership]:
        stmt = select(OrganizationMembership).where(
            OrganizationMembership.organization_id == organization_id,
            OrganizationMembership.user_id == user_id
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_membership(self, organization_id: UUID, user_id: UUID, role: str) -> OrganizationMembership:
        membership = OrganizationMembership(
            organization_id=organization_id,
            user_id=user_id,
            role=role
        )
        self.session.add(membership)
        return membership

    async def save(self) -> None:
        await self.session.flush()
