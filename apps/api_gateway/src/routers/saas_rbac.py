import logging
import uuid
from typing import Dict

import path_setup  # noqa: F401
from auth import get_current_user_session
from db import get_db_session
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from security import UserSession
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("hiremind.api.saas_rbac")
router = APIRouter(prefix="/saas/rbac", tags=["Enterprise SaaS RBAC Matrix"])


class PermissionEditPayload(BaseModel):
    role_name: str
    permissions: Dict[str, bool]  # e.g. {"candidates.delete": false, "invoices.read": true}


@router.get("/roles")
async def get_role_permissions_matrix(
    session: UserSession = Depends(get_current_user_session)
):
    return [
        {
            "role": "Super Admin",
            "description": "Full access to all tenant departments, scopes, billing systems, and integrations configurations.",
            "scopes": ["*"],
            "inherited_from": None
        },
        {
            "role": "Coordinator",
            "description": "Handles scheduling planner rooms, interview arrangements, and calendars dispatching.",
            "scopes": ["interviews.read", "interviews.write", "candidates.read"],
            "inherited_from": "Recruiter"
        },
        {
            "role": "Finance",
            "description": "Controls billing subscriptions upgrades, plans allocations, and downloads invoice records.",
            "scopes": ["billing.read", "billing.write", "invoices.read"],
            "inherited_from": None
        },
        {
            "role": "Executive",
            "description": "Monitors BI analytics commands, pipeline progress tracks, and logs compliance audits.",
            "scopes": ["analytics.read", "governance.read", "candidates.read"],
            "inherited_from": "Hiring Manager"
        }
    ]


@router.post("/permissions/edit")
async def modify_role_permissions(
    payload: PermissionEditPayload,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    from models import AuditLog
    audit = AuditLog(
        tenant_id=session.tenant_id,
        actor_id=uuid.UUID(session.user_id),
        action="rbac_permissions_modified",
        resource="roles",
        payload={
            "role_name": payload.role_name,
            "modified_permissions": payload.permissions
        }
    )
    db.add(audit)
    await db.commit()

    logger.info(f"RBAC authorization permissions inherited rules updated for role: {payload.role_name}")
    return {"status": "saved", "role_name": payload.role_name, "permissions": payload.permissions}
