import logging
import re
import uuid
from typing import Optional

import path_setup  # noqa: F401
from auth import get_current_user_session
from db import get_db_session
from fastapi import APIRouter, Depends, HTTPException, status
from models import CandidateComment, CandidateProfile, JobPosting, RecruiterNotification, User
from pydantic import BaseModel
from security import UserSession
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

logger = logging.getLogger("hiremind.api.workspace")
router = APIRouter(prefix="/workspace", tags=["Enterprise Recruiter Workspace"])


class CommentCreate(BaseModel):
    candidate_id: str
    content: str
    parent_comment_id: Optional[str] = None
    is_private: bool = False


@router.get("/cockpit")
async def get_cockpit_stats(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    job_res = await db.execute(select(JobPosting).where(JobPosting.organization_id == session.tenant_id))
    jobs = job_res.scalars().all()

    cand_res = await db.execute(select(CandidateProfile))
    candidates = cand_res.scalars().all()

    return {
        "time_saved_hours": 124.5,
        "automation_actions_run": 842,
        "interview_completion_rate": "94.8%",
        "hiring_velocity_days": 18.2,
        "response_time_minutes": 14,
        "tasks_completed": 124,
        "ai_token_usage": 1845000,
        "productivity_score": 98.2,
        "active_jobs_count": len(jobs),
        "total_candidates_count": len(candidates),
        "pending_approvals_count": 3,
        "unread_notifications_count": 2,
        "leaderboard": [
            {"name": "Marie Curie", "hired": 12, "score": 98.5},
            {"name": "Ada Lovelace", "hired": 9, "score": 95.0},
            {"name": "Grace Hopper", "hired": 8, "score": 92.4}
        ]
    }


@router.post("/comments", status_code=status.HTTP_201_CREATED)
async def post_comment(
    payload: CommentCreate,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    cand_uuid = uuid.UUID(payload.candidate_id)
    parent_uuid = uuid.UUID(payload.parent_comment_id) if payload.parent_comment_id else None

    # Check candidate exists
    cand_check = await db.execute(select(CandidateProfile).where(CandidateProfile.id == cand_uuid))
    if not cand_check.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Candidate not found")

    new_comment = CandidateComment(
        organization_id=session.tenant_id,
        candidate_id=cand_uuid,
        user_id=uuid.UUID(session.user_id),
        parent_comment_id=parent_uuid,
        content=payload.content,
        is_private=payload.is_private
    )
    db.add(new_comment)
    await db.commit()

    # Log to audit trail for compliance
    from models import AuditLog
    audit = AuditLog(
        tenant_id=session.tenant_id,
        actor_id=uuid.UUID(session.user_id),
        action="comment_posted",
        resource="candidate_comments",
        payload={
            "comment_id": str(new_comment.id),
            "candidate_id": str(cand_uuid),
            "is_private": payload.is_private
        }
    )
    db.add(audit)
    await db.commit()

    # Emit live event to Redis Pub/Sub Event Bus
    from events import BaseEvent, RedisEventBus
    event_bus = RedisEventBus()
    event = BaseEvent(
        event_type="comment_added",
        tenant_id=session.tenant_id,
        correlation_id=str(uuid.uuid4()),
        payload={
            "candidate_id": str(cand_uuid),
            "content": payload.content,
            "is_private": payload.is_private
        }
    )
    await event_bus.publish(event)

    # Mention Scanning: Look for @name format
    mentions = re.findall(r"@(\w+)", payload.content)
    for name in mentions:
        user_res = await db.execute(
            select(User).where(
                (User.first_name.ilike(f"%{name}%")) | (User.email.ilike(f"%{name}%"))
            )
        )
        matched_user = user_res.scalars().first()
        if matched_user:
            alert = RecruiterNotification(
                organization_id=session.tenant_id,
                recipient_id=matched_user.id,
                sender_id=uuid.UUID(session.user_id),
                notification_type="mention",
                is_read=False,
                message=f"You were mentioned in a candidate comment: '{payload.content[:35]}...'"
            )
            db.add(alert)
    
    await db.commit()
    return {
        "id": str(new_comment.id),
        "content": new_comment.content,
        "is_private": new_comment.is_private,
        "created_at": new_comment.created_at.isoformat()
    }


@router.get("/comments/{candidate_id}")
async def get_comments(
    candidate_id: str,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    cand_uuid = uuid.UUID(candidate_id)
    stmt = select(CandidateComment, User).join(User, CandidateComment.user_id == User.id).where(
        CandidateComment.candidate_id == cand_uuid,
        CandidateComment.organization_id == session.tenant_id
    ).order_by(CandidateComment.created_at.asc())

    res = await db.execute(stmt)
    records = res.all()

    return [
        {
            "id": str(c.id),
            "parent_comment_id": str(c.parent_comment_id) if c.parent_comment_id else None,
            "content": c.content,
            "is_private": c.is_private,
            "created_at": c.created_at.isoformat(),
            "author_name": f"{u.first_name} {u.last_name}",
            "author_email": u.email
        }
        for c, u in records
    ]


@router.get("/notifications")
async def get_notifications(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    stmt = select(RecruiterNotification, User).join(User, RecruiterNotification.sender_id == User.id).where(
        RecruiterNotification.recipient_id == uuid.UUID(session.user_id),
        RecruiterNotification.organization_id == session.tenant_id
    ).order_by(RecruiterNotification.created_at.desc())

    res = await db.execute(stmt)
    records = res.all()

    return [
        {
            "id": str(n.id),
            "type": n.notification_type,
            "is_read": n.is_read,
            "message": n.message,
            "created_at": n.created_at.isoformat(),
            "sender_name": f"{u.first_name} {u.last_name}"
        }
        for n, u in records
    ]


@router.post("/notifications/{id}/read")
async def mark_notification_read(
    id: str,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    notif_uuid = uuid.UUID(id)
    notif = await db.get(RecruiterNotification, notif_uuid)
    if notif:
        notif.is_read = True
        await db.commit()
    return {"status": "success"}
