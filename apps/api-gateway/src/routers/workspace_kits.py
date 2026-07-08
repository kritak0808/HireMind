import logging
import uuid
from typing import Optional

import path_setup  # noqa: F401
from auth import get_current_user_session
from db import get_db_session
from fastapi import APIRouter, Depends, HTTPException, status
from models import CandidateEvaluation, CandidateProfile, InterviewKitQuestion, User
from pydantic import BaseModel
from security import UserSession
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

logger = logging.getLogger("hiremind.api.workspace_kits")
router = APIRouter(prefix="/workspace/kits", tags=["Recruiter Evaluation scorecards"])


class ScorecardPayload(BaseModel):
    candidate_id: str
    scores: dict  # {"technical": 90, "behavioral": 80}
    overall_recommendation: str  # 'hire', 'watch', 'reject'
    comments: Optional[str] = None


@router.get("/questions")
async def list_kit_questions(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    check_stmt = select(InterviewKitQuestion).where(InterviewKitQuestion.organization_id == session.tenant_id)
    res = await db.execute(check_stmt)
    questions = res.scalars().all()

    if not questions:
        defaults = [
            InterviewKitQuestion(
                organization_id=session.tenant_id,
                category="technical",
                question_text="Explain the difference between process and thread scheduling models, and how to handle thread pools safely in Go/C++.",
                rubric_scoring_criteria={"rubric": "Score based on concurrency understanding, memory maps, and race flags."}
            ),
            InterviewKitQuestion(
                organization_id=session.tenant_id,
                category="technical",
                question_text="Design a resilient caching hierarchy for a high-throughput system. Address eviction policies and stale data mitigation.",
                rubric_scoring_criteria={"rubric": "Evaluates knowledge of Redis, LRU/LFU eviction models, and cache invalidation strategies."}
            ),
            InterviewKitQuestion(
                organization_id=session.tenant_id,
                category="behavioral",
                question_text="Describe a situation where you had a strong technical disagreement with a team member. How did you coordinate resolution?",
                rubric_scoring_criteria={"rubric": "Evaluates communication efficiency, compromise framework, and professional feedback delivery."}
            )
        ]
        for d in defaults:
            db.add(d)
        await db.commit()
        questions = defaults

    return [
        {
            "id": str(q.id),
            "category": q.category,
            "question_text": q.question_text,
            "criteria": q.rubric_scoring_criteria
        }
        for q in questions
    ]


@router.post("/evaluations", status_code=status.HTTP_201_CREATED)
async def submit_scorecard(
    payload: ScorecardPayload,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    cand_uuid = uuid.UUID(payload.candidate_id)

    # Verify candidate profile
    cand_res = await db.execute(select(CandidateProfile).where(CandidateProfile.id == cand_uuid))
    if not cand_res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Candidate not found")

    new_eval = CandidateEvaluation(
        organization_id=session.tenant_id,
        candidate_id=cand_uuid,
        interviewer_id=uuid.UUID(session.user_id),
        scores=payload.scores,
        overall_recommendation=payload.overall_recommendation,
        comments=payload.comments
    )
    db.add(new_eval)
    await db.commit()

    return {
        "status": "submitted",
        "evaluation_id": str(new_eval.id),
        "overall_recommendation": new_eval.overall_recommendation
    }


@router.get("/evaluations/{candidate_id}")
async def get_scorecards(
    candidate_id: str,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    cand_uuid = uuid.UUID(candidate_id)
    stmt = select(CandidateEvaluation, User).join(User, CandidateEvaluation.interviewer_id == User.id).where(
        CandidateEvaluation.candidate_id == cand_uuid,
        CandidateEvaluation.organization_id == session.tenant_id
    ).order_by(CandidateEvaluation.created_at.desc())

    res = await db.execute(stmt)
    records = res.all()

    return [
        {
            "id": str(e.id),
            "interviewer_name": f"{u.first_name} {u.last_name}",
            "scores": e.scores,
            "overall_recommendation": e.overall_recommendation,
            "comments": e.comments,
            "created_at": e.created_at.isoformat()
        }
        for e, u in records
    ]
