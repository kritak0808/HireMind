import logging
import uuid
from datetime import datetime
from typing import Optional

import path_setup  # noqa: F401
from auth import get_current_user_session
from db import get_db_session
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from security import UserSession
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("hiremind.api.workspace_collab")
router = APIRouter(prefix="/workspace/collab", tags=["Enterprise Collaboration Platforms"])


class WebhookPayload(BaseModel):
    webhook_url: str
    is_enabled: bool = True


class VotePayload(BaseModel):
    candidate_id: str
    vote: str  # 'hire', 'reject', 'hold'
    rationale: Optional[str] = None


@router.post("/slack-webhook")
async def configure_slack_webhook(
    payload: WebhookPayload,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    # Simulated webhook registry persistence (can log for auditable compliance)
    logger.info(f"Registered Slack Integration webhook for tenant {session.tenant_id}: {payload.webhook_url}")
    return {"status": "configured", "webhook_url": payload.webhook_url}


@router.post("/vote", status_code=status.HTTP_201_CREATED)
async def submit_decision_vote(
    payload: VotePayload,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    cand_uuid = uuid.UUID(payload.candidate_id)
    # Write to compliance AuditLog
    from models import AuditLog
    audit = AuditLog(
        tenant_id=session.tenant_id,
        actor_id=uuid.UUID(session.user_id),
        action="consensus_vote_submitted",
        resource="candidate_profiles",
        payload={
            "candidate_id": str(cand_uuid),
            "vote": payload.vote,
            "rationale": payload.rationale
        }
    )
    db.add(audit)
    await db.commit()

    # Emit realtime update through redis pubsub event
    from events import BaseEvent, RedisEventBus
    event_bus = RedisEventBus()
    event = BaseEvent(
        event_type="consensus_vote_submitted",
        tenant_id=session.tenant_id,
        correlation_id=str(uuid.uuid4()),
        payload={
            "candidate_id": str(cand_uuid),
            "voter": session.user_id,
            "vote": payload.vote
        }
    )
    await event_bus.publish(event)

    return {"status": "recorded", "vote": payload.vote}


@router.get("/announcements")
async def get_team_announcements(
    session: UserSession = Depends(get_current_user_session)
):
    return [
        {
            "id": str(uuid.uuid4()),
            "title": "Welcome to Q3 Recruitment Cycle",
            "content": "All engineering openings require candidates to complete coding panels workspaces assessments before executive review.",
            "created_at": datetime.utcnow().isoformat(),
            "author": "Chief Recruitment Officer"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Qdrant Vector Indexing Upgraded",
            "content": "Resume embedding generation is now synchronized synchronously via background Celery queues.",
            "created_at": datetime.utcnow().isoformat(),
            "author": "DevOps Architect"
        }
    ]
