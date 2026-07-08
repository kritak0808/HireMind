import logging
import uuid
from typing import Optional

import path_setup  # noqa: F401
from auth import get_current_user_session
from db import get_db_session
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from models import CandidateProfile, EmailTemplate, EmailTrackingLog, User
from pydantic import BaseModel
from security import UserSession
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

logger = logging.getLogger("hiremind.api.workspace_email")
router = APIRouter(prefix="/workspace/emails", tags=["Recruiter Email Suite"])


class SendEmailPayload(BaseModel):
    candidate_id: str
    template_type: str  # 'offer', 'rejection', 'invitation'
    custom_subject: Optional[str] = None
    custom_body: Optional[str] = None


@router.get("/templates")
async def list_templates(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    # Pre-seed template defaults if missing in DB
    check_stmt = select(EmailTemplate).where(EmailTemplate.organization_id == session.tenant_id)
    res = await db.execute(check_stmt)
    templates = res.scalars().all()

    if not templates:
        # Seed core defaults
        defaults = [
            EmailTemplate(
                organization_id=session.tenant_id,
                name="Standard Offer Letter",
                template_type="offer",
                subject="Offer of Employment — HireMind AI",
                body_template="Dear {{candidate_name}},\n\nWe are thrilled to offer you the position of Software Engineer at HireMind AI. Please review the attached contract and let us know your decision.\n\nWarm regards,\nHiring Team"
            ),
            EmailTemplate(
                organization_id=session.tenant_id,
                name="Interview Invitation",
                template_type="invitation",
                subject="Interview Invitation — HireMind AI",
                body_template="Dear {{candidate_name}},\n\nWe have reviewed your profile and would love to schedule a technical assessment with our team.\n\nBest,\nRecruiting Team"
            ),
            EmailTemplate(
                organization_id=session.tenant_id,
                name="Polite Rejection",
                template_type="rejection",
                subject="Application Status Update",
                body_template="Dear {{candidate_name}},\n\nThank you for your interest in our openings. Unfortunately, we have decided to move forward with other candidates at this time.\n\nBest of luck,\nRecruiting Team"
            )
        ]
        for d in defaults:
            db.add(d)
        await db.commit()
        templates = defaults

    return [
        {
            "id": str(t.id),
            "name": t.name,
            "type": t.template_type,
            "subject": t.subject,
            "body": t.body_template
        }
        for t in templates
    ]


@router.post("/send", status_code=status.HTTP_201_CREATED)
async def send_candidate_email(
    payload: SendEmailPayload,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    cand_uuid = uuid.UUID(payload.candidate_id)

    cand_res = await db.execute(select(CandidateProfile).where(CandidateProfile.id == cand_uuid))
    cand = cand_res.scalar_one_or_none()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")

    user_res = await db.execute(select(User).where(User.id == cand.user_id))
    user = user_res.scalar_one_or_none()
    email_to = user.email if user else "candidate@hiremind.ai"
    candidate_name = f"{user.first_name} {user.last_name}" if user else "Candidate"

    # Compile templates parameters
    subject = payload.custom_subject or "Update on your application"
    body = payload.custom_body or f"Dear {candidate_name},\n\nWe are reviewing your application."

    # Parse variables
    subject = subject.replace("{{candidate_name}}", candidate_name)
    body = body.replace("{{candidate_name}}", candidate_name)

    # Save to EmailTrackingLog
    tracking_token = uuid.uuid4()
    log = EmailTrackingLog(
        organization_id=session.tenant_id,
        candidate_id=cand_uuid,
        email_type=payload.template_type,
        status="sent",
        tracking_token=tracking_token
    )
    db.add(log)
    await db.commit()

    # Trigger async send email celery worker task
    from libs.tasks.tasks import send_email_task
    email_content = f"{body}\n\n[Tracked reference: {tracking_token}]"
    send_email_task.delay(email_to, subject, email_content)

    return {
        "status": "enqueued",
        "tracking_token": str(tracking_token),
        "recipient": email_to,
        "subject": subject
    }


@router.get("/track/{token}")
async def track_email_open(
    token: str,
    db: AsyncSession = Depends(get_db_session)
):
    token_uuid = uuid.UUID(token)
    stmt = select(EmailTrackingLog).where(EmailTrackingLog.tracking_token == token_uuid)
    res = await db.execute(stmt)
    log = res.scalar_one_or_none()

    if log:
        log.open_count += 1
        await db.commit()
        logger.info(f"Email tracker token {token} open registered (total: {log.open_count})")

    # Return a 1x1 transparent tracking pixel GIF
    pixel = b'\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00\x21\xf9\x04\x01\x00\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b'
    return Response(content=pixel, media_type="image/gif")


@router.get("/logs/{candidate_id}")
async def get_email_logs(
    candidate_id: str,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    cand_uuid = uuid.UUID(candidate_id)
    stmt = select(EmailTrackingLog).where(
        EmailTrackingLog.candidate_id == cand_uuid,
        EmailTrackingLog.organization_id == session.tenant_id
    ).order_by(EmailTrackingLog.sent_at.desc())

    res = await db.execute(stmt)
    logs = res.scalars().all()

    return [
        {
            "id": str(log_item.id),
            "type": log_item.email_type,
            "sent_at": log_item.sent_at.isoformat(),
            "status": log_item.status,
            "opens": log_item.open_count,
            "clicks": log_item.click_count,
            "replies": log_item.reply_count
        }
        for log_item in logs
    ]
