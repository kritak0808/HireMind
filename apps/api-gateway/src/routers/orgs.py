import logging
import uuid
from datetime import datetime, timedelta
from typing import List

import path_setup  # noqa: F401
from auth import get_current_user_session
from config import settings
from db import get_db_session
from dtos import OrganizationCreate, TokenResponse
from fastapi import APIRouter, Depends, HTTPException, status
from models import Organization, OrganizationInvitation, OrganizationMembership
from repositories import SQLAlchemyInvitationRepository, SQLAlchemyOrganizationRepository, SQLAlchemyUserRepository
from security import UserSession, generate_access_token
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("hiremind.api.orgs")
router = APIRouter(prefix="/organizations", tags=["Organizations"])

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_organization(
    payload: OrganizationCreate,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    org_repo = SQLAlchemyOrganizationRepository(db)

    org = Organization(
        name=payload.name,
        domain_lock=payload.domain_lock
    )
    await org_repo.add(org)
    await org_repo.save()

    # Assign organization ownership role to creator
    await org_repo.create_membership(
        organization_id=org.id,
        user_id=uuid.UUID(session.user_id),
        role="org_admin"
    )
    await org_repo.save()

    return {
        "id": str(org.id),
        "name": org.name,
        "role": "org_admin"
    }

@router.post("/switch/{target_org_id}", response_model=TokenResponse)
async def switch_organization(
    target_org_id: str,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    target_uuid = uuid.UUID(target_org_id)
    user_uuid = uuid.UUID(session.user_id)

    org_repo = SQLAlchemyOrganizationRepository(db)
    user_repo = SQLAlchemyUserRepository(db)

    # Verify user belongs to target organization
    membership = await org_repo.get_membership(target_uuid, user_uuid)
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of target organization"
        )

    user = await user_repo.get_by_id(user_uuid)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Generate new token bound to switched tenant context
    token_session = UserSession(
        user_id=str(user.id),
        email=user.email,
        tenant_id=str(target_uuid),
        roles=[membership.role]
    )

    access_token = generate_access_token(
        session=token_session,
        secret_key=settings.JWT_SECRET_KEY,
        expires_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer"
    )

@router.post("/invite")
async def invite_user(
    email: str,
    role: str,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    # Only Org Admins can invite others
    if "org_admin" not in session.roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organization administrators can invite users"
        )

    invite_repo = SQLAlchemyInvitationRepository(db)

    # Generate a random invitation token
    token = str(uuid.uuid4())
    invitation = OrganizationInvitation(
        organization_id=session.tenant_id,
        email=email,
        role=role,
        token=token,
        invited_by=uuid.UUID(session.user_id),
        expires_at=datetime.utcnow() + timedelta(days=7),
        status="pending"
    )
    await invite_repo.add(invitation)
    await invite_repo.save()

    return {
        "status": "invited",
        "email": email,
        "token": token
    }

@router.get("", response_model=List[dict])
async def list_user_organizations(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    user_uuid = uuid.UUID(session.user_id)
    stmt = select(Organization).join(OrganizationMembership).where(OrganizationMembership.user_id == user_uuid)
    result = await db.execute(stmt)
    records = result.scalars().all()

    # Query direct memberships to find roles
    stmt_membership = select(OrganizationMembership).where(OrganizationMembership.user_id == user_uuid)
    result_mem = await db.execute(stmt_membership)
    memberships = result_mem.scalars().all()
    role_map = {m.organization_id: m.role for m in memberships}

    return [
        {
            "id": str(org.id),
            "name": org.name,
            "role": role_map.get(org.id, "member")
        }
        for org in records
    ]
