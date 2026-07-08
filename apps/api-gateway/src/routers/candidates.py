import logging
import uuid

import path_setup  # noqa: F401
from auth import get_current_user_session
from db import get_db_session
from fastapi import APIRouter, Depends, HTTPException, status
from models import CandidateNote, CandidateProfile, CandidateTimelineEvent
from security import UserSession
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

logger = logging.getLogger("hiremind.api.candidates")
router = APIRouter(prefix="/candidates", tags=["Candidates Management"])

@router.get("/{id}")
async def get_candidate(
    id: str,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    candidate_uuid = uuid.UUID(id)

    # Enforce tenant check context via RLS session setup
    # Read profile details from DB
    result = await db.execute(
        select(CandidateProfile).where(CandidateProfile.id == candidate_uuid)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )

    return {
        "id": str(profile.id),
        "phone_number": profile.phone_number,
        "created_at": profile.created_at.isoformat()
    }

@router.post("/{id}/notes", status_code=status.HTTP_201_CREATED)
async def add_candidate_note(
    id: str,
    content: str,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    candidate_uuid = uuid.UUID(id)

    # Verify candidate exists
    result = await db.execute(
        select(CandidateProfile).where(CandidateProfile.id == candidate_uuid)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )

    note = CandidateNote(
        organization_id=session.tenant_id,
        candidate_id=candidate_uuid,
        author_id=uuid.UUID(session.user_id),
        content=content
    )
    db.add(note)

    # Write a timeline event for compliance tracking
    timeline_event = CandidateTimelineEvent(
        organization_id=session.tenant_id,
        candidate_id=candidate_uuid,
        event_type="note_added",
        description="Recruiter added assessment notes to candidate profile",
        actor_id=uuid.UUID(session.user_id)
    )
    db.add(timeline_event)
    await db.commit()

    return {
        "id": str(note.id),
        "content": note.content,
        "created_at": note.created_at.isoformat()
    }
