import hashlib
import hmac
import logging
import uuid
from typing import Optional

import path_setup  # noqa: F401
from auth import get_current_user_session
from contracts import FeatureEnabledEvent, IntegrationInstalledEvent
from db import get_db_session
from events import RedisEventBus
from fastapi import APIRouter, Depends, HTTPException, status
from repositories import SQLAlchemyEnterpriseRepository
from security import UserSession
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("hiremind.api.enterprise")
router = APIRouter(prefix="/enterprise", tags=["Enterprise Platform Services"])

# ─── Organization Settings ────────────────────────────────────────────────────

@router.get("/settings")
async def get_org_settings(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyEnterpriseRepository(db)
    org_id = session.tenant_id
    settings = await repo.get_org_settings(org_id)
    if not settings:
        raise HTTPException(status_code=404, detail="No settings found for this organization")
    return {
        "locale": settings.localization_locale,
        "branding_url": settings.workspace_branding_url,
        "compliance_policies": settings.compliance_policies_payload
    }

@router.put("/settings")
async def update_org_settings(
    locale: str = "en-US",
    branding_url: Optional[str] = None,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyEnterpriseRepository(db)
    org_id = session.tenant_id
    settings = await repo.upsert_org_settings(org_id, locale, branding_url)
    await repo.save()
    await db.commit()
    return {"status": "updated", "locale": settings.localization_locale}

# ─── Feature Flags ────────────────────────────────────────────────────────────

@router.get("/flags")
async def list_feature_flags(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyEnterpriseRepository(db)
    org_id = session.tenant_id
    flags = await repo.list_feature_flags(org_id)
    return [{"key": f.flag_key, "enabled": f.is_enabled, "rules": f.rules_payload} for f in flags]

@router.put("/flags/{flag_key}")
async def toggle_flag(
    flag_key: str,
    enabled: bool,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyEnterpriseRepository(db)
    org_id = session.tenant_id
    await repo.toggle_feature_flag(org_id, flag_key, enabled)
    await repo.save()
    await db.commit()

    event_bus = RedisEventBus()
    await event_bus.publish(FeatureEnabledEvent(
        tenant_id=session.tenant_id,
        correlation_id=str(uuid.uuid4()),
        payload={"organization_id": session.tenant_id, "flag_key": flag_key, "is_enabled": enabled}
    ))
    return {"flag_key": flag_key, "enabled": enabled}

# ─── Integration Connectors ───────────────────────────────────────────────────

@router.get("/integrations")
async def list_integrations(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyEnterpriseRepository(db)
    org_id = session.tenant_id
    connectors = await repo.list_connectors(org_id)
    return [
        {"id": str(c.id), "type": c.connector_type, "connected": c.is_connected}
        for c in connectors
    ]

@router.post("/integrations", status_code=status.HTTP_201_CREATED)
async def install_integration(
    connector_type: str,
    credentials: dict,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyEnterpriseRepository(db)
    org_id = session.tenant_id
    connector = await repo.register_connector(org_id, connector_type, credentials)
    await repo.save()
    await db.commit()

    event_bus = RedisEventBus()
    await event_bus.publish(IntegrationInstalledEvent(
        tenant_id=session.tenant_id,
        correlation_id=str(uuid.uuid4()),
        payload={"organization_id": session.tenant_id, "connector_type": connector_type}
    ))
    return {"id": str(connector.id), "type": connector.connector_type, "connected": True}

# ─── Webhook Endpoints ────────────────────────────────────────────────────────

@router.get("/webhooks")
async def list_webhooks(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyEnterpriseRepository(db)
    org_id = session.tenant_id
    webhooks = await repo.list_webhooks(org_id)
    return [
        {"id": str(w.id), "url": w.url_callback, "events": w.events_subscribed, "active": w.is_active}
        for w in webhooks
    ]

@router.post("/webhooks", status_code=status.HTTP_201_CREATED)
async def register_webhook(
    url: str,
    events: list,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyEnterpriseRepository(db)
    org_id = session.tenant_id
    # Generate HMAC-SHA256 signing secret
    secret = hmac.new(session.tenant_id.encode(), url.encode(), hashlib.sha256).hexdigest()
    webhook = await repo.register_webhook(org_id, url, secret, events)
    await repo.save()
    await db.commit()
    return {"id": str(webhook.id), "secret": secret, "url": url}

# ─── Billing / Invoices ───────────────────────────────────────────────────────

@router.get("/billing/invoices")
async def list_invoices(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyEnterpriseRepository(db)
    org_id = session.tenant_id
    invoices = await repo.list_invoices(org_id)
    return [
        {"id": str(i.id), "amount": float(i.amount_paid), "status": i.status, "date": i.created_at.isoformat()}
        for i in invoices
    ]
