import logging
import uuid
from typing import Optional

import path_setup  # noqa: F401
from auth import get_current_user_session
from db import get_db_session
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, EmailStr
from security import UserSession
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("hiremind.api.saas_orgs")
router = APIRouter(prefix="/saas/orgs", tags=["Enterprise SaaS Organizations"])


class BrandingPayload(BaseModel):
    custom_logo_url: str
    custom_domain: Optional[str] = None


class InvitationPayload(BaseModel):
    email: EmailStr
    role: str  # 'recruiter', 'hiring_manager', 'coordinator', 'interviewer', 'finance', 'executive'


@router.post("/branding")
async def update_org_branding(
    payload: BrandingPayload,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    from models import AuditLog
    audit = AuditLog(
        tenant_id=session.tenant_id,
        actor_id=uuid.UUID(session.user_id),
        action="branding_domain_updated",
        resource="organizations",
        payload={
            "custom_logo_url": payload.custom_logo_url,
            "custom_domain": payload.custom_domain
        }
    )
    db.add(audit)
    await db.commit()

    return {"status": "saved", "custom_domain": payload.custom_domain}


@router.post("/invitations", status_code=status.HTTP_201_CREATED)
async def invite_team_member(
    payload: InvitationPayload,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    from models import AuditLog
    audit = AuditLog(
        tenant_id=session.tenant_id,
        actor_id=uuid.UUID(session.user_id),
        action="membership_invitation_sent",
        resource="organization_memberships",
        payload={
            "invitee_email": payload.email,
            "assigned_role": payload.role
        }
    )
    db.add(audit)
    await db.commit()

    logger.info(f"Tenant {session.tenant_id} enqueued recruitment workspace invitation email for: {payload.email}")
    return {"status": "sent", "invitee": payload.email, "role": payload.role}


@router.post("/switch")
async def switch_workspace(
    target_organization_id: str,
    session: UserSession = Depends(get_current_user_session)
):
    target_uuid = uuid.UUID(target_organization_id)
    # Simulated switching context token regeneration
    logger.info(f"User {session.user_id} switched active workspace context to: {target_uuid}")
    return {
        "status": "switched",
        "active_tenant_id": str(target_uuid),
        "token": "regenerated-workspace-claims-jwt-token"
    }
