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

logger = logging.getLogger("hiremind.api.saas_billing")
router = APIRouter(prefix="/saas/billing", tags=["Enterprise SaaS Billing"])


class UpgradePlanPayload(BaseModel):
    plan_name: str  # 'Starter', 'Professional', 'Business', 'Enterprise'


class SeatAssignPayload(BaseModel):
    user_email: str
    action: str  # 'assign', 'recover', 'transfer'
    transfer_to_email: Optional[str] = None


@router.post("/checkout")
async def create_checkout_session(
    plan_name: str,
    session: UserSession = Depends(get_current_user_session)
):
    checkout_url = f"https://checkout.stripe.com/pay/mock_session_{uuid.uuid4()}"
    logger.info(f"Created Stripe checkout session for plan {plan_name} on tenant {session.tenant_id}")
    return {"status": "success", "checkout_url": checkout_url}


@router.post("/subscriptions")
async def upgrade_subscription_tier(
    payload: UpgradePlanPayload,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    from models import AuditLog
    audit = AuditLog(
        tenant_id=session.tenant_id,
        actor_id=uuid.UUID(session.user_id),
        action="subscription_tier_changed",
        resource="subscriptions",
        payload={
            "new_plan": payload.plan_name,
            "initiated_at": datetime.utcnow().isoformat()
        }
    )
    db.add(audit)
    await db.commit()

    logger.info(f"Subscription upgraded to '{payload.plan_name}' for organization {session.tenant_id}")
    return {"status": "upgraded", "plan": payload.plan_name}


@router.get("/meter")
async def get_billing_usage_meter(
    session: UserSession = Depends(get_current_user_session)
):
    # Simulated metered logs summaries from telemetry caches
    return {
        "ai_tokens_used": 142050,
        "ai_tokens_limit": 500000,
        "resume_parsing_count": 87,
        "resume_parsing_limit": 200,
        "vector_storage_embeddings": 1052,
        "vector_storage_limit": 10000,
        "active_seats_assigned": 4,
        "active_seats_limit": 10,
        "api_requests_count": 12400,
        "api_requests_limit": 50000
    }


@router.post("/licensing/assign")
async def assign_seat_license(
    payload: SeatAssignPayload,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    from models import AuditLog
    audit = AuditLog(
        tenant_id=session.tenant_id,
        actor_id=uuid.UUID(session.user_id),
        action="seat_license_modified",
        resource="licensing",
        payload={
            "target_email": payload.user_email,
            "operation": payload.action,
            "transfer_target": payload.transfer_to_email
        }
    )
    db.add(audit)
    await db.commit()

    logger.info(f"Seat license {payload.action} operation completed for: {payload.user_email}")
    return {"status": "completed", "user": payload.user_email, "action": payload.action}
