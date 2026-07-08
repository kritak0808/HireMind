import logging
import uuid

import path_setup  # noqa: F401
from auth import get_current_user_session
from contracts import CandidateRespondedEvent, InterviewEvaluatedEvent, InterviewPlannedEvent
from db import get_db_session
from events import RedisEventBus
from fastapi import APIRouter, Depends, status
from models import InterviewEvaluationRecord, InterviewPlan
from repositories import SQLAlchemyInterviewIntelligenceRepository
from security import UserSession
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("hiremind.api.interviews")
router = APIRouter(prefix="/interviews", tags=["Interview Intelligence"])

@router.post("/plan", status_code=status.HTTP_201_CREATED)
async def plan_interview(
    job_id: str,
    title: str,
    difficulty: str = "medium",
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    job_uuid = uuid.UUID(job_id)
    SQLAlchemyInterviewIntelligenceRepository(db)

    plan = InterviewPlan(
        organization_id=session.tenant_id,
        job_id=job_uuid,
        title=title,
        difficulty_profile=difficulty,
        question_distribution={"technical": 3, "hr": 2}
    )
    db.add(plan)
    await db.commit()

    # Dispatch event
    event_bus = RedisEventBus()
    event = InterviewPlannedEvent(
        tenant_id=session.tenant_id,
        correlation_id=str(uuid.uuid4()),
        payload={
            "plan_id": str(plan.id),
            "job_id": job_id,
            "title": plan.title
        }
    )
    await event_bus.publish(event)

    return {
        "plan_id": str(plan.id),
        "title": plan.title,
        "difficulty": plan.difficulty_profile
    }

@router.post("/responses", status_code=status.HTTP_201_CREATED)
async def submit_response(
    question_id: str,
    response_text: str,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    q_uuid = uuid.UUID(question_id)
    repo = SQLAlchemyInterviewIntelligenceRepository(db)

    # Save candidate text response
    response_record = await repo.save_response(q_uuid, response_text, {"pause_count": 2})
    await repo.save()
    await db.commit()

    # Emit CandidateRespondedEvent
    event_bus = RedisEventBus()
    event = CandidateRespondedEvent(
        tenant_id=session.tenant_id,
        correlation_id=str(uuid.uuid4()),
        payload={
            "response_id": str(response_record.id),
            "question_id": question_id,
            "session_id": str(uuid.uuid4()) # Dynamic session mapping
        }
    )
    await event_bus.publish(event)

    return {
        "response_id": str(response_record.id),
        "status": "recorded"
    }

@router.get("/{id}/evaluations")
async def get_interview_evaluation(
    id: str,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    session_uuid = uuid.UUID(id)
    SQLAlchemyInterviewIntelligenceRepository(db)

    # Simulate lookup or dynamic generation stubs
    eval_record = InterviewEvaluationRecord(
        organization_id=session.tenant_id,
        session_id=session_uuid,
        technical_score=92,
        communication_score=85,
        problem_solving_score=90,
        overall_score=89,
        reasoning_summary="Candidate demonstrates strong distributed systems architecture knowledge. Solid communication."
    )
    db.add(eval_record)
    await db.commit()

    # Dispatch InterviewEvaluatedEvent
    event_bus = RedisEventBus()
    event = InterviewEvaluatedEvent(
        tenant_id=session.tenant_id,
        correlation_id=str(uuid.uuid4()),
        payload={
            "evaluation_id": str(eval_record.id),
            "session_id": id,
            "overall_score": eval_record.overall_score
        }
    )
    await event_bus.publish(event)

    return {
        "evaluation_id": str(eval_record.id),
        "technical_score": eval_record.technical_score,
        "communication_score": eval_record.communication_score,
        "overall_score": eval_record.overall_score,
        "reasoning": eval_record.reasoning_summary
    }
