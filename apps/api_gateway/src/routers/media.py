import logging
import uuid

import path_setup  # noqa: F401
from auth import get_current_user_session
from contracts import MediaSessionCreatedEvent, RecordingStartedEvent
from db import get_db_session
from events import RedisEventBus
from fastapi import APIRouter, Depends, status
from models import MediaSession, RecordingMetadata
from repositories import SQLAlchemyMediaRepository
from security import UserSession
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("hiremind.api.media")
router = APIRouter(prefix="/media", tags=["Voice & Video Media Services"])

@router.post("/negotiate", status_code=status.HTTP_201_CREATED)
async def negotiate_media_session(
    interview_session_id: str,
    sdp_offer: str,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    interview_uuid = uuid.UUID(interview_session_id)
    SQLAlchemyMediaRepository(db)

    # WebRTC room negotiation allocation stub
    room_id = f"room_{uuid.uuid4()}"
    media_session = MediaSession(
        organization_id=session.tenant_id,
        interview_session_id=interview_uuid,
        webrtc_room_id=room_id,
        status="connected"
    )
    db.add(media_session)
    await db.commit()

    # Emit MediaSessionCreatedEvent
    event_bus = RedisEventBus()
    event = MediaSessionCreatedEvent(
        tenant_id=session.tenant_id,
        correlation_id=str(uuid.uuid4()),
        payload={
            "media_session_id": str(media_session.id),
            "webrtc_room_id": room_id
        }
    )
    await event_bus.publish(event)

    # Simulated SDP answer payload matching standard connection loop
    sdp_answer = "v=0\no=hiremind 12345 67890 IN IP4 127.0.0.1\ns=Media Session Answer\nt=0 0\na=group:BUNDLE audio video"

    return {
        "media_session_id": str(media_session.id),
        "room_id": room_id,
        "sdp_answer": sdp_answer
    }

@router.post("/recording", status_code=status.HTTP_201_CREATED)
async def toggle_recording(
    media_session_id: str,
    action: str, # 'start', 'stop'
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    session_uuid = uuid.UUID(media_session_id)

    if action == "start":
        record_meta = RecordingMetadata(
            organization_id=session.tenant_id,
            session_id=session_uuid,
            s3_key=f"recordings/{session.tenant_id}/{media_session_id}/stream_raw.webm",
            duration_seconds=0.0,
            file_size_bytes=0
        )
        db.add(record_meta)
        await db.commit()

        # Dispatch event
        event_bus = RedisEventBus()
        event = RecordingStartedEvent(
            tenant_id=session.tenant_id,
            correlation_id=str(uuid.uuid4()),
            payload={
                "recording_id": str(record_meta.id),
                "session_id": media_session_id,
                "s3_key": record_meta.s3_key
            }
        )
        await event_bus.publish(event)

        return {"recording_id": str(record_meta.id), "status": "recording"}

    return {"status": "stopped"}
