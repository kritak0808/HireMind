import logging
import secrets
import uuid
from datetime import datetime
from typing import List

import path_setup  # noqa: F401
from auth import get_current_user_session
from db import get_db_session
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from security import UserSession
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("hiremind.api.saas_developer")
router = APIRouter(prefix="/saas/developer", tags=["Developer Console Portal"])


class APIKeyPayload(BaseModel):
    name: str
    scopes: List[str]  # e.g. ["candidates.read", "applications.write"]


class WebhookPayload(BaseModel):
    callback_url: str
    events: List[str]  # e.g. ["candidate.applied"]


@router.post("/apikeys")
async def generate_api_key(
    payload: APIKeyPayload,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    raw_key = f"hm_live_{secrets.token_hex(24)}"
    # Log to audit trail
    from models import AuditLog
    audit = AuditLog(
        tenant_id=session.tenant_id,
        actor_id=uuid.UUID(session.user_id),
        action="api_key_generated",
        resource="api_keys",
        payload={
            "key_name": payload.name,
            "scopes_assigned": payload.scopes
        }
    )
    db.add(audit)
    await db.commit()

    return {
        "status": "created",
        "name": payload.name,
        "api_key": raw_key,
        "scopes": payload.scopes,
        "created_at": datetime.utcnow().isoformat()
    }


@router.post("/webhooks")
async def register_webhook_endpoint(
    payload: WebhookPayload,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    from models import AuditLog
    audit = AuditLog(
        tenant_id=session.tenant_id,
        actor_id=uuid.UUID(session.user_id),
        action="webhook_endpoint_registered",
        resource="webhooks",
        payload={
            "callback_url": payload.callback_url,
            "events_subscribed": payload.events
        }
    )
    db.add(audit)
    await db.commit()

    return {
        "status": "registered",
        "webhook_id": str(uuid.uuid4()),
        "callback_url": payload.callback_url,
        "secret_token": f"whsec_{secrets.token_hex(16)}"
    }


@router.get("/sdk")
async def get_developer_sdk_docs(
    session: UserSession = Depends(get_current_user_session)
):
    return {
        "rest_base_url": "https://api.hiremind.ai/v1",
        "curl_example": "curl -H 'Authorization: Bearer hm_live_...' https://api.hiremind.ai/v1/search/candidates",
        "python_sdk_snippet": "from hiremind import Client\nclient = Client(api_key='hm_live_...')\ncandidates = client.candidates.list()"
    }
