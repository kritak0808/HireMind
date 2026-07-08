import uuid
from typing import Optional

from models import (
    CandidateResponse,
    GeneratedQuestion,
    InterviewEvaluationRecord,
    InterviewPlan,
    InterviewSessionRecord,
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select


class SQLAlchemyInterviewIntelligenceRepository:
    """SQLAlchemy implementation of Interview Intelligence database access."""
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_plan_by_job(self, job_id: uuid.UUID) -> Optional[InterviewPlan]:
        stmt = select(InterviewPlan).where(InterviewPlan.job_id == job_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_session(self, session_id: uuid.UUID) -> Optional[InterviewSessionRecord]:
        stmt = select(InterviewSessionRecord).where(InterviewSessionRecord.id == session_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_active_session_by_application(self, application_id: uuid.UUID) -> Optional[InterviewSessionRecord]:
        stmt = select(InterviewSessionRecord).where(
            InterviewSessionRecord.application_id == application_id,
            InterviewSessionRecord.status == "active"
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def save_question(self, session_id: uuid.UUID, text: str, category: str, difficulty: str, seq: int) -> GeneratedQuestion:
        record = GeneratedQuestion(
            session_id=session_id,
            question_text=text,
            category=category,
            difficulty_level=difficulty,
            sequence_number=seq
        )
        self.session.add(record)
        return record

    async def save_response(self, question_id: uuid.UUID, text: str, metrics: dict) -> CandidateResponse:
        record = CandidateResponse(
            question_id=question_id,
            response_text=text,
            voice_metrics=metrics
        )
        self.session.add(record)
        return record

    async def save_evaluation(self, session_id: uuid.UUID, tech: int, comm: int, problem: int, overall: int, reason: str) -> InterviewEvaluationRecord:
        record = InterviewEvaluationRecord(
            session_id=session_id,
            technical_score=tech,
            communication_score=comm,
            problem_solving_score=problem,
            overall_score=overall,
            reasoning_summary=reason
        )
        self.session.add(record)
        return record

    async def save(self) -> None:
        await self.session.flush()
