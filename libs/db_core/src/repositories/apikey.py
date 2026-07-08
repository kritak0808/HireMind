from typing import List, Optional, Protocol
from uuid import UUID

from models import UserAPIKey
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from .base import BaseRepository


class APIKeyRepository(BaseRepository[UserAPIKey], Protocol):
    async def get_by_hash(self, hashed_key: str) -> Optional[UserAPIKey]:
        ...

class SQLAlchemyAPIKeyRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, id: UUID) -> Optional[UserAPIKey]:
        result = await self.session.execute(select(UserAPIKey).where(UserAPIKey.id == id))
        return result.scalar_one_or_none()

    async def get_by_hash(self, hashed_key: str) -> Optional[UserAPIKey]:
        stmt = select(UserAPIKey).where(
            UserAPIKey.hashed_key == hashed_key,
            UserAPIKey.is_active
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def add(self, entity: UserAPIKey) -> None:
        self.session.add(entity)

    async def delete(self, entity: UserAPIKey) -> None:
        await self.session.delete(entity)

    async def list_all(self) -> List[UserAPIKey]:
        result = await self.session.execute(select(UserAPIKey))
        return list(result.scalars().all())

    async def save(self) -> None:
        await self.session.flush()
