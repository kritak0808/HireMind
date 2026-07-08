from typing import List, Optional, Protocol
from uuid import UUID

from models import UserSessionRecord
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from .base import BaseRepository


class SessionRepository(BaseRepository[UserSessionRecord], Protocol):
    async def get_by_token_hash(self, token_hash: str) -> Optional[UserSessionRecord]:
        ...

    async def revoke_all_user_sessions(self, user_id: UUID) -> None:
        ...

class SQLAlchemySessionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, id: UUID) -> Optional[UserSessionRecord]:
        result = await self.session.execute(select(UserSessionRecord).where(UserSessionRecord.id == id))
        return result.scalar_one_or_none()

    async def get_by_token_hash(self, token_hash: str) -> Optional[UserSessionRecord]:
        stmt = select(UserSessionRecord).where(
            UserSessionRecord.refresh_token_hash == token_hash,
            not UserSessionRecord.is_revoked
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def add(self, entity: UserSessionRecord) -> None:
        self.session.add(entity)

    async def delete(self, entity: UserSessionRecord) -> None:
        await self.session.delete(entity)

    async def list_all(self) -> List[UserSessionRecord]:
        result = await self.session.execute(select(UserSessionRecord))
        return list(result.scalars().all())

    async def revoke_all_user_sessions(self, user_id: UUID) -> None:
        await self.session.execute(
            update(UserSessionRecord)
            .where(UserSessionRecord.user_id == user_id)
            .values(is_revoked=True)
        )

    async def save(self) -> None:
        await self.session.flush()
