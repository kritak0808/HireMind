import logging
import uuid
from datetime import datetime

import path_setup  # noqa: F401
from auth import get_current_user_session
from db import get_db_session
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from security import UserSession
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("hiremind.api.saas_marketplace")
router = APIRouter(prefix="/saas/marketplace", tags=["Enterprise SaaS Marketplace"])


class InstallConnectorPayload(BaseModel):
    connector_type: str  # 'slack', 'teams', 'zoom', 'workday', 'sap'
    credentials_payload: dict


@router.get("/catalog")
async def get_integrations_catalog(
    session: UserSession = Depends(get_current_user_session)
):
    return [
        {
            "connector_type": "google_workspace",
            "name": "Google Workspace & Meet",
            "category": "Calendar & Video Calling",
            "description": "Auto-schedule calendar panels invites and trigger Google Meet links.",
            "is_installed": True
        },
        {
            "connector_type": "slack",
            "name": "Slack Enterprise Hub",
            "category": "Communication",
            "description": "Publish pipeline stage alerts and recruiter mention notifications directly to Slack channels.",
            "is_installed": False
        },
        {
            "connector_type": "jira",
            "name": "Jira & Linear Sync",
            "category": "Productivity",
            "description": "Synchronize development candidate coding assessments with tasks board lists.",
            "is_installed": False
        },
        {
            "connector_type": "workday",
            "name": "Workday Integration",
            "category": "HRIS & ATS Systems",
            "description": "Sync hired candidates information with corporate employee employee systems.",
            "is_installed": True
        }
    ]


@router.post("/install")
async def install_integration_connector(
    payload: InstallConnectorPayload,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    from models import AuditLog
    audit = AuditLog(
        tenant_id=session.tenant_id,
        actor_id=uuid.UUID(session.user_id),
        action="marketplace_connector_installed",
        resource="integrations",
        payload={
            "connector_type": payload.connector_type,
            "installed_at": datetime.utcnow().isoformat()
        }
    )
    db.add(audit)
    await db.commit()

    logger.info(f"Tenant {session.tenant_id} installed integration connector: {payload.connector_type}")
    return {"status": "installed", "connector": payload.connector_type}
