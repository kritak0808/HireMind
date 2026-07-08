import uuid
from typing import Optional

from models import CodeSubmission, CodingAssessment, ExecutionResult, PlagiarismReport
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select


class SQLAlchemyCodingRepository:
    """SQLAlchemy implementation of Coding Intelligence database access."""
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_assessment(self, assessment_id: uuid.UUID) -> Optional[CodingAssessment]:
        stmt = select(CodingAssessment).where(CodingAssessment.id == assessment_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_submission(self, submission_id: uuid.UUID) -> Optional[CodeSubmission]:
        stmt = select(CodeSubmission).where(CodeSubmission.id == submission_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def add_submission(self, assessment_id: uuid.UUID, candidate_id: uuid.UUID, code: str, lang: str, organization_id: uuid.UUID) -> CodeSubmission:
        record = CodeSubmission(
            assessment_id=assessment_id,
            candidate_id=candidate_id,
            source_code=code,
            programming_language=lang,
            organization_id=organization_id
        )
        self.session.add(record)
        return record

    async def save_execution_result(self, submission_id: uuid.UUID, status: str, stdout: str, stderr: str, cpu: float, memory: float) -> ExecutionResult:
        record = ExecutionResult(
            submission_id=submission_id,
            status=status,
            stdout_output=stdout,
            stderr_output=stderr,
            cpu_time_used=cpu,
            memory_used_mb=memory
        )
        self.session.add(record)
        return record

    async def get_plagiarism_report(self, submission_id: uuid.UUID) -> Optional[PlagiarismReport]:
        stmt = select(PlagiarismReport).where(PlagiarismReport.submission_id == submission_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def save(self) -> None:
        await self.session.flush()
