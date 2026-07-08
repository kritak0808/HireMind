from typing import List, Optional, Protocol
from uuid import UUID

from models import User
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from .base import BaseRepository


class UserRepository(BaseRepository[User], Protocol):
    """UserRepository interface outlining user context database interactions."""
    async def get_by_email(self, email: str) -> Optional[User]:
        ...

    async def update_status(self, user_id: UUID, is_active: bool) -> None:
        ...

class SQLAlchemyUserRepository:
    """SQLAlchemy implementation of UserRepository."""
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, id: UUID) -> Optional[User]:
        from sqlalchemy.orm import selectinload
        result = await self.session.execute(
            select(User).where(User.id == id).options(selectinload(User.memberships))
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[User]:
        from sqlalchemy.orm import selectinload
        result = await self.session.execute(
            select(User).where(User.email == email).options(selectinload(User.memberships))
        )
        return result.scalar_one_or_none()

    async def add(self, entity: User) -> None:
        self.session.add(entity)

    async def delete(self, entity: User) -> None:
        await self.session.delete(entity)

    async def list_all(self) -> List[User]:
        result = await self.session.execute(select(User))
        return list(result.scalars().all())

    async def update_status(self, user_id: UUID, is_active: bool) -> None:
        await self.session.execute(
            update(User).where(User.id == user_id).values(is_active=is_active)
        )

    async def save(self) -> None:
        await self.session.flush()
