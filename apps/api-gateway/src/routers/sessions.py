import logging
import uuid

import path_setup  # noqa: F401
from auth import get_current_user_session
from db import get_db_session
from fastapi import APIRouter, Depends, status
from repositories import SQLAlchemySessionRepository
from security import UserSession
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("hiremind.api.sessions")
router = APIRouter(prefix="/sessions", tags=["Session Management"])

@router.delete("/all", status_code=status.HTTP_200_OK)
async def revoke_all_sessions(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    session_repo = SQLAlchemySessionRepository(db)
    user_uuid = uuid.UUID(session.user_id)

    await session_repo.revoke_all_user_sessions(user_uuid)
    await session_repo.save()

    logger.info(f"Revoked all sessions for user {session.user_id}")
    return {"status": "success", "message": "All sessions revoked"}
