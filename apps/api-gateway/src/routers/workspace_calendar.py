import logging
import uuid
from datetime import datetime
from typing import Optional

import path_setup  # noqa: F401
from auth import get_current_user_session
from db import get_db_session
from fastapi import APIRouter, Depends, HTTPException, status
from models import CandidateProfile, InterviewCalendarEvent, User
from pydantic import BaseModel
from security import UserSession
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

logger = logging.getLogger("hiremind.api.workspace_calendar")
router = APIRouter(prefix="/workspace/calendar", tags=["Recruiter Calendaring Suite"])


class ScheduleCreate(BaseModel):
    candidate_id: str
    interviewer_id: str
    title: str
    start_time: datetime
    end_time: datetime
    time_zone: str = "UTC"
    meeting_room: Optional[str] = None


@router.post("/schedule", status_code=status.HTTP_201_CREATED)
async def schedule_meeting(
    payload: ScheduleCreate,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    cand_uuid = uuid.UUID(payload.candidate_id)
    interviewer_uuid = uuid.UUID(payload.interviewer_id)

    # Check candidate exists
    cand_check = await db.execute(select(CandidateProfile).where(CandidateProfile.id == cand_uuid))
    if not cand_check.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Candidate not found")

    # Conflict Detection:
    # Query other events for this interviewer overlapping the proposed timeframe
    conflict_stmt = select(InterviewCalendarEvent).where(
        InterviewCalendarEvent.interviewer_id == interviewer_uuid,
        InterviewCalendarEvent.organization_id == session.tenant_id,
        InterviewCalendarEvent.start_time < payload.end_time,
        InterviewCalendarEvent.end_time > payload.start_time
    )
    conflict_res = await db.execute(conflict_stmt)
    existing_conflicts = conflict_res.scalars().all()

    if existing_conflicts:
        return {
            "status": "conflict_detected",
            "message": f"Conflict detected for interviewer in meeting room '{existing_conflicts[0].meeting_room or 'default'}' from {existing_conflicts[0].start_time.isoformat()} to {existing_conflicts[0].end_time.isoformat()}.",
            "conflicts": [
                {"id": str(c.id), "title": c.title, "start_time": c.start_time.isoformat(), "end_time": c.end_time.isoformat()}
                for c in existing_conflicts
            ]
        }

    # Store event in DB
    new_event = InterviewCalendarEvent(
        organization_id=session.tenant_id,
        candidate_id=cand_uuid,
        interviewer_id=interviewer_uuid,
        title=payload.title,
        start_time=payload.start_time,
        end_time=payload.end_time,
        time_zone=payload.time_zone,
        meeting_room=payload.meeting_room,
        is_external_synced=True
    )
    db.add(new_event)
    await db.commit()

    return {
        "status": "scheduled",
        "event_id": str(new_event.id),
        "title": new_event.title,
        "meeting_room": new_event.meeting_room,
        "start_time": new_event.start_time.isoformat(),
        "end_time": new_event.end_time.isoformat()
    }


@router.get("/events")
async def list_calendar_events(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    stmt = select(InterviewCalendarEvent, User).join(User, InterviewCalendarEvent.interviewer_id == User.id).where(
        InterviewCalendarEvent.organization_id == session.tenant_id
    ).order_by(InterviewCalendarEvent.start_time.asc())

    res = await db.execute(stmt)
    records = res.all()

    return [
        {
            "id": str(e.id),
            "candidate_id": str(e.candidate_id),
            "title": e.title,
            "start_time": e.start_time.isoformat(),
            "end_time": e.end_time.isoformat(),
            "meeting_room": e.meeting_room,
            "interviewer_name": f"{u.first_name} {u.last_name}"
        }
        for e, u in records
    ]
