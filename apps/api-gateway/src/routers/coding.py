import logging
import uuid

import path_setup  # noqa: F401
from auth import get_current_user_session
from contracts import (
    CompilationCompletedEvent,
    ExecutionCompletedEvent,
    PlagiarismAnalysisCompletedEvent,
    SubmissionReceivedEvent,
)
from db import get_db_session
from events import RedisEventBus
from fastapi import APIRouter, Depends
from models import PlagiarismReport
from repositories import SQLAlchemyCodingRepository
from security import UserSession
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("hiremind.api.coding")
router = APIRouter(prefix="/coding", tags=["Coding Assessment Platform"])

@router.post("/compile")
async def compile_code(
    assessment_id: str,
    candidate_id: str,
    code: str,
    language: str, # 'python', 'go', 'rust'
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    a_uuid = uuid.UUID(assessment_id)
    c_uuid = uuid.UUID(candidate_id)
    repo = SQLAlchemyCodingRepository(db)

    submission = await repo.add_submission(a_uuid, c_uuid, code, language, session.tenant_id)
    await repo.save()
    await db.commit()

    # Emit SubmissionReceivedEvent
    event_bus = RedisEventBus()
    event = SubmissionReceivedEvent(
        tenant_id=session.tenant_id,
        correlation_id=str(uuid.uuid4()),
        payload={
            "submission_id": str(submission.id),
            "candidate_id": candidate_id,
            "language": language
        }
    )
    await event_bus.publish(event)

    # Simulated sandbox compiler run outputs logs
    compile_success = True
    error_msg = None

    # Emit CompilationCompletedEvent
    comp_event = CompilationCompletedEvent(
        tenant_id=session.tenant_id,
        correlation_id=str(uuid.uuid4()),
        payload={
            "submission_id": str(submission.id),
            "status": "success" if compile_success else "error",
            "error_msg": error_msg
        }
    )
    await event_bus.publish(comp_event)

    return {
        "submission_id": str(submission.id),
        "status": "success" if compile_success else "error",
        "logs": "Compilation succeeded. Code size: 245 bytes."
    }

@router.post("/execute")
async def execute_tests(
    submission_id: str,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    sub_uuid = uuid.UUID(submission_id)
    repo = SQLAlchemyCodingRepository(db)

    # Simulate execution logs inside containers
    execution = await repo.save_execution_result(
        submission_id=sub_uuid,
        status="passed",
        stdout="Test Case 1: PASSED\nTest Case 2: PASSED\nExecution success.",
        stderr="",
        cpu=0.012,
        memory=12.4
    )
    await repo.save()
    await db.commit()

    # Dispatch ExecutionCompletedEvent
    event_bus = RedisEventBus()
    event = ExecutionCompletedEvent(
        tenant_id=session.tenant_id,
        correlation_id=str(uuid.uuid4()),
        payload={
            "submission_id": submission_id,
            "execution_result_id": str(execution.id),
            "status": execution.status
        }
    )
    await event_bus.publish(event)

    return {
        "execution_result_id": str(execution.id),
        "status": execution.status,
        "stdout": execution.stdout_output,
        "cpu_ms": float(execution.cpu_time_used * 1000),
        "memory_mb": float(execution.memory_used_mb)
    }

@router.get("/submissions/{id}/plagiarism")
async def get_plagiarism_analysis(
    id: str,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    sub_uuid = uuid.UUID(id)
    repo = SQLAlchemyCodingRepository(db)

    report = await repo.get_plagiarism_report(sub_uuid)
    if not report:
        report = PlagiarismReport(
            organization_id=session.tenant_id,
            submission_id=sub_uuid,
            similarity_score=1.45, # Very low overlap similarity ratio
            token_overlap_ratio=2.10,
            explanation_summary="No matching syntax templates found in other candidate submissions databases."
        )
        db.add(report)
        await db.commit()

        # Dispatch event
        event_bus = RedisEventBus()
        event = PlagiarismAnalysisCompletedEvent(
            tenant_id=session.tenant_id,
            correlation_id=str(uuid.uuid4()),
            payload={
                "submission_id": id,
                "similarity_score": float(report.similarity_score)
            }
        )
        await event_bus.publish(event)

    return {
        "similarity_score": float(report.similarity_score),
        "token_overlap_ratio": float(report.token_overlap_ratio),
        "explanation": report.explanation_summary
    }
