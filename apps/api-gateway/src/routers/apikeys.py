import hashlib
import logging
import secrets
import uuid

import path_setup  # noqa: F401
from auth import get_current_user_session
from db import get_db_session
from fastapi import APIRouter, Depends, status
from models import UserAPIKey
from repositories import SQLAlchemyAPIKeyRepository
from security import UserSession
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("hiremind.api.apikeys")
router = APIRouter(prefix="/apikeys", tags=["API Keys"])

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_api_key(
    name: str,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    key_repo = SQLAlchemyAPIKeyRepository(db)

    # Generate API key sequence
    raw_key = "hm_live_" + secrets.token_urlsafe(32)
    key_prefix = raw_key[:12]

    # Securely hash API key for validation
    hashed_key = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

    api_key = UserAPIKey(
        organization_id=str(uuid.UUID(session.tenant_id)),
        user_id=uuid.UUID(session.user_id),
        name=name,
        key_prefix=key_prefix,
        hashed_key=hashed_key,
        scopes=["jobs:read", "evals:read"],
        is_active=True
    )
    await key_repo.add(api_key)
    await key_repo.save()

    return {
        "id": str(api_key.id),
        "name": api_key.name,
        "api_key": raw_key, # Expose plain key only once at creation
        "prefix": key_prefix
    }
