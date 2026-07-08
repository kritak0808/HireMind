import logging
import uuid
from typing import Dict, Optional

import path_setup  # noqa: F401
from auth import get_current_user_session
from db import get_db_session
from fastapi import APIRouter, Depends
from models import AIExperiment, EvaluationReport
from pydantic import BaseModel
from security import UserSession
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("hiremind.api.ai_mlops")
router = APIRouter(prefix="/ai-mlops", tags=["AI MLOps Experimentation"])


class FeedbackPayload(BaseModel):
    prediction_id: str
    is_accepted: bool
    edited_output: Optional[str] = None
    rating_feedback: Optional[int] = None # 1-5 stars


class CreateExperimentPayload(BaseModel):
    name: str
    experiment_type: str # 'ab', 'canary'
    hypothesis: str
    traffic_split: Dict[str, float] # {'control': 0.5, 'treatment': 0.5}


@router.get("/experiments")
async def get_experiments(
    db: AsyncSession = Depends(get_db_session)
):
    stmt = select(AIExperiment)
    res = await db.execute(stmt)
    exps = res.scalars().all()

    return [
        {
            "id": str(e.id),
            "name": e.name,
            "experiment_type": e.experiment_type,
            "status": e.status,
            "traffic_split": e.traffic_split,
            "created_at": e.created_at.isoformat()
        }
        for e in exps
    ]


@router.post("/experiments")
async def create_experiment(
    payload: CreateExperimentPayload,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    exp = AIExperiment(
        organization_id=session.tenant_id,
        name=payload.name,
        experiment_type=payload.experiment_type,
        status="running",
        traffic_split=payload.traffic_split,
        hypothesis=payload.hypothesis
    )
    db.add(exp)
    await db.commit()

    return {"status": "created", "experiment_id": str(exp.id)}


@router.get("/evaluations/reports")
async def get_evaluation_reports(
    db: AsyncSession = Depends(get_db_session)
):
    stmt = select(EvaluationReport).order_by(EvaluationReport.created_at.desc())
    res = await db.execute(stmt)
    reports = res.scalars().all()

    return [
        {
            "id": str(r.id),
            "name": r.name,
            "overall_score": r.overall_score,
            "scores": r.scores,
            "created_at": r.created_at.isoformat()
        }
        for r in reports
    ]


@router.get("/cost/history")
async def get_ai_cost_logs(
    session: UserSession = Depends(get_current_user_session)
):
    return [
        {
            "model_name": "gemini-2.0-flash",
            "prompt_tokens": 124000,
            "completion_tokens": 34000,
            "total_cost": 0.0984,
            "purpose": "resume_parsing"
        },
        {
            "model_name": "gpt-4o-enterprise",
            "prompt_tokens": 87000,
            "completion_tokens": 42000,
            "total_cost": 0.8142,
            "purpose": "interview_evaluation"
        }
    ]


@router.post("/feedback")
async def submit_human_feedback(
    payload: FeedbackPayload,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    # Log to audit compliance
    from models import AuditLog
    audit = AuditLog(
        tenant_id=session.tenant_id,
        actor_id=uuid.UUID(session.user_id),
        action="human_feedback_submitted",
        resource="ai_predictions",
        payload={
            "prediction_id": payload.prediction_id,
            "is_accepted": payload.is_accepted,
            "edited_output": payload.edited_output,
            "rating_feedback": payload.rating_feedback
        }
    )
    db.add(audit)
    await db.commit()

    return {"status": "feedback_saved", "prediction_id": payload.prediction_id}
