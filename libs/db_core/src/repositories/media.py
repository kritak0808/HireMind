import uuid
from typing import Optional

from models import MediaSession, MediaStream, SessionQualityReport, TranscriptSegment
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select


class SQLAlchemyMediaRepository:
    """SQLAlchemy implementation of Media Platform database access."""
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_session(self, session_id: uuid.UUID) -> Optional[MediaSession]:
        stmt = select(MediaSession).where(MediaSession.id == session_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def add_stream(self, session_id: uuid.UUID, stream_type: str, codec: str, bitrate: int) -> MediaStream:
        record = MediaStream(
            session_id=session_id,
            stream_type=stream_type,
            codec=codec,
            bitrate_kbps=bitrate
        )
        self.session.add(record)
        return record

    async def add_transcript_segment(self, session_id: uuid.UUID, speaker_id: uuid.UUID, text: str, start: float, end: float, conf: float) -> TranscriptSegment:
        record = TranscriptSegment(
            session_id=session_id,
            speaker_id=speaker_id,
            transcript_text=text,
            start_time_offset=start,
            end_time_offset=end,
            confidence=conf
        )
        self.session.add(record)
        return record

    async def save_quality_report(self, session_id: uuid.UUID, loss: float, jitter: int, bandwidth: float) -> SessionQualityReport:
        record = SessionQualityReport(
            session_id=session_id,
            packet_loss_percentage=loss,
            jitter_ms=jitter,
            bandwidth_mbps=bandwidth
        )
        self.session.add(record)
        return record

    async def save(self) -> None:
        await self.session.flush()
