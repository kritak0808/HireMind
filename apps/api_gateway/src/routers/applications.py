import logging
import uuid
from datetime import datetime
from typing import List, Optional

import path_setup  # noqa: F401
from auth import get_current_user_session
from contracts import PipelineStageChangedEvent
from db import get_db_session
from events import RedisEventBus
from fastapi import APIRouter, Depends, HTTPException, status
from models import Application, CandidateProfile, User
from pydantic import BaseModel
from repositories import SQLAlchemyApplicationRepository
from security import UserSession
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

logger = logging.getLogger("hiremind.api.applications")
router = APIRouter(prefix="/applications", tags=["Applications Pipeline"])

@router.get("", response_model=List[dict])
async def list_applications(
    job_id: Optional[str] = None,
    stage: Optional[str] = None,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    stmt = select(Application, CandidateProfile, User).select_from(Application).join(
        CandidateProfile, Application.candidate_id == CandidateProfile.id
    ).join(
        User, CandidateProfile.user_id == User.id
    ).where(Application.organization_id == session.tenant_id)

    if job_id:
        stmt = stmt.where(Application.job_id == uuid.UUID(job_id))
    if stage:
        stmt = stmt.where(Application.current_stage == stage)

    result = await db.execute(stmt)
    records = result.all()

    return [
        {
            "id": str(app.id),
            "job_id": str(app.job_id),
            "candidate_id": str(app.candidate_id),
            "current_stage": app.current_stage,
            "stage_status": app.stage_status,
            "created_at": app.created_at.isoformat(),
            "candidate_name": f"{usr.first_name} {usr.last_name}",
            "candidate_email": usr.email,
            "candidate_phone": cand.phone_number
        }
        for app, cand, usr in records
    ]

@router.post("/{id}/move-stage")
async def move_pipeline_stage(
    id: str,
    target_stage: str,
    stage_status: str = "pending",
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    app_uuid = uuid.UUID(id)
    repo = SQLAlchemyApplicationRepository(db)

    app_record = await repo.get_by_id(app_uuid)
    if not app_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application record not found"
        )

    old_stage = app_record.current_stage
    await repo.update_pipeline_stage(app_uuid, target_stage, stage_status)

    # Re-calculate SLA logs
    from models import PipelineSlaLog
    
    # Close old SLA stage
    close_stmt = select(PipelineSlaLog).where(
        PipelineSlaLog.candidate_id == app_record.candidate_id,
        PipelineSlaLog.stage_name == old_stage,
        PipelineSlaLog.exited_at.is_(None)
    )
    close_res = await db.execute(close_stmt)
    old_log = close_res.scalar_one_or_none()
    if old_log:
        old_log.exited_at = datetime.utcnow()

    # Create new SLA stage entry
    new_log = PipelineSlaLog(
        organization_id=session.tenant_id,
        candidate_id=app_record.candidate_id,
        stage_name=target_stage,
        entered_at=datetime.utcnow()
    )
    db.add(new_log)

    # Log to compliance audit trails
    from models import AuditLog
    audit = AuditLog(
        tenant_id=session.tenant_id,
        actor_id=uuid.UUID(session.user_id),
        action="stage_changed",
        resource="applications",
        payload={
            "application_id": str(app_record.id),
            "candidate_id": str(app_record.candidate_id),
            "old_stage": old_stage,
            "new_stage": target_stage
        }
    )
    db.add(audit)

    await repo.save()
    await db.commit()

    # Emit PipelineStageChanged event
    event_bus = RedisEventBus()
    event = PipelineStageChangedEvent(
        tenant_id=session.tenant_id,
        correlation_id=str(uuid.uuid4()),
        payload={
            "application_id": str(app_record.id),
            "candidate_id": str(app_record.candidate_id),
            "old_stage": old_stage,
            "new_stage": target_stage,
            "reason": "Recruiter manual transition via gateway"
        }
    )
    await event_bus.publish(event)

    return {
        "id": str(app_record.id),
        "old_stage": old_stage,
        "new_stage": target_stage,
        "stage_status": stage_status
    }


class BulkMovePayload(BaseModel):
    application_ids: List[str]
    target_stage: str
    stage_status: str = "pending"


@router.post("/bulk-move-stage")
async def bulk_move_stage(
    payload: BulkMovePayload,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    results = []
    for app_id in payload.application_ids:
        try:
            res = await move_pipeline_stage(
                id=app_id,
                target_stage=payload.target_stage,
                stage_status=payload.stage_status,
                session=session,
                db=db
            )
            results.append(res)
        except Exception as e:
            logger.error(f"Bulk move failed for app {app_id}: {str(e)}")

    return {"status": "success", "results": results}


@router.post("/{id}/undo-stage")
async def undo_stage_change(
    id: str,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    app_uuid = uuid.UUID(id)
    app_record = await db.get(Application, app_uuid)
    if not app_record:
        raise HTTPException(status_code=404, detail="Application not found")

    from models import PipelineSlaLog
    
    # Fetch active log and delete it
    active_stmt = select(PipelineSlaLog).where(
        PipelineSlaLog.candidate_id == app_record.candidate_id,
        PipelineSlaLog.exited_at.is_(None)
    ).order_by(PipelineSlaLog.entered_at.desc())
    active_res = await db.execute(active_stmt)
    active_log = active_res.scalar_one_or_none()

    if active_log:
        await db.delete(active_log)

    # Reopen last completed stage log
    last_stmt = select(PipelineSlaLog).where(
        PipelineSlaLog.candidate_id == app_record.candidate_id,
        PipelineSlaLog.exited_at.is_not(None)
    ).order_by(PipelineSlaLog.exited_at.desc())
    last_res = await db.execute(last_stmt)
    last_log = last_res.scalars().first()

    previous_stage = "Applied"
    if last_log:
        previous_stage = last_log.stage_name
        last_log.exited_at = None # reopen it

    # Revert application stage
    app_record.current_stage = previous_stage
    await db.commit()

    return {
        "id": str(app_record.id),
        "reverted_to_stage": previous_stage
    }


@router.get("/sla-timers")
async def get_sla_timers(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    # Returns the count of days/hours each active application is in their current stage
    stmt = select(Application).where(Application.organization_id == session.tenant_id)
    res = await db.execute(stmt)
    apps = res.scalars().all()

    from models import PipelineSlaLog
    timers = {}
    for a in apps:
        sla_stmt = select(PipelineSlaLog).where(
            PipelineSlaLog.candidate_id == a.candidate_id,
            PipelineSlaLog.stage_name == a.current_stage,
            PipelineSlaLog.exited_at.is_(None)
        )
        sla_res = await db.execute(sla_stmt)
        log = sla_res.scalar_one_or_none()
        if log:
            diff = datetime.utcnow() - log.entered_at
            hours = round(diff.total_seconds() / 3600.0, 1)
            timers[str(a.id)] = {"hours_in_stage": hours, "sla_breach": hours > 48.0}
        else:
            timers[str(a.id)] = {"hours_in_stage": 0.0, "sla_breach": False}

    return timers

