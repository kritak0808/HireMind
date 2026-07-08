import logging
import uuid
from datetime import datetime
from typing import Optional

import path_setup  # noqa: F401
from auth import get_current_user_session
from db import get_db_session
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from security import UserSession
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("hiremind.api.saas_identity")
router = APIRouter(prefix="/saas/identity", tags=["Enterprise SaaS Identity"])


class SSOConfigPayload(BaseModel):
    provider: str  # 'google', 'microsoft', 'saml', 'oidc'
    client_id: str
    client_secret: str
    metadata_url: Optional[str] = None
    is_active: bool = True


class MFASetupPayload(BaseModel):
    mfa_type: str  # 'totp', 'passkey'
    is_enabled: bool = True


@router.post("/sso/config")
async def configure_sso(
    payload: SSOConfigPayload,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    # Log to audit compliance
    from models import AuditLog
    audit = AuditLog(
        tenant_id=session.tenant_id,
        actor_id=uuid.UUID(session.user_id),
        action="sso_provider_configured",
        resource="organizations",
        payload={
            "provider": payload.provider,
            "client_id": payload.client_id,
            "is_active": payload.is_active
        }
    )
    db.add(audit)
    await db.commit()

    logger.info(f"SSO Provider '{payload.provider}' configured for tenant {session.tenant_id}")
    return {"status": "configured", "provider": payload.provider}


@router.get("/sso/login")
async def sso_login_callback(
    provider: str,
    code: str,
    state: Optional[str] = None
):
    # Simulates verification callbacks from Google/MS/SAML Providers
    logger.debug(f"Intercepted OAuth verification callback for provider: {provider}")
    return {
        "status": "authenticated",
        "provider": provider,
        "token": "mock-sso-jwt-token-payload"
    }


@router.post("/mfa/setup")
async def configure_mfa(
    payload: MFASetupPayload,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    # Log to audit trail
    from models import AuditLog
    audit = AuditLog(
        tenant_id=session.tenant_id,
        actor_id=uuid.UUID(session.user_id),
        action="mfa_configured",
        resource="users",
        payload={
            "mfa_type": payload.mfa_type,
            "is_enabled": payload.is_enabled
        }
    )
    db.add(audit)
    await db.commit()

    return {"status": "updated", "mfa_type": payload.mfa_type, "is_enabled": payload.is_enabled}


@router.get("/sessions")
async def get_active_sessions(
    session: UserSession = Depends(get_current_user_session)
):
    return [
        {
            "id": str(uuid.uuid4()),
            "device": "Chrome / Windows 11 (Current Session)",
            "ip_address": "192.168.1.124",
            "last_active": datetime.utcnow().isoformat(),
            "is_trusted": True
        },
        {
            "id": str(uuid.uuid4()),
            "device": "Safari / iPhone 15 Pro",
            "ip_address": "172.56.21.90",
            "last_active": datetime.utcnow().isoformat(),
            "is_trusted": False
        }
    ]
