import hashlib
import logging
import uuid

import path_setup  # noqa: F401
from auth import get_current_user_session
from db import get_db_session
from fastapi import APIRouter, Depends, HTTPException, status
from repositories import SQLAlchemyAIRepository, SQLAlchemyGovernanceRepository
from security import LLMGateway, UserSession
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("hiremind.api.ai")
router = APIRouter(prefix="/ai", tags=["AI Orchestrator Runtime"])

@router.get("/agents")
async def list_agents(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Lists registered agents in the system registry.
    """
    return [
        {
            "name": "Resume Intelligence Agent",
            "capabilities": ["resume_parsing", "skills_extraction"],
            "version": "1.0.0",
            "status": "healthy"
        },
        {
            "name": "Coding Sandbox Evaluator",
            "capabilities": ["code_compilation", "unit_test_scoring"],
            "version": "1.2.0",
            "status": "healthy"
        },
        {
            "name": "Conversational HR Recruiter",
            "capabilities": ["voice_synthesis", "semantic_dialogue"],
            "version": "2.0.1",
            "status": "active"
        }
    ]

@router.get("/prompts/{name}")
async def get_prompt_template(
    name: str,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyAIRepository(db)
    content = await repo.get_active_prompt(name)
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prompt template {name} not found"
        )
    return {"name": name, "content": content}

@router.post("/route")
async def execute_model_route(
    model_name: str,
    prompt_input: str,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Route prompts validating safety rules, executing A/B or shadow routing,
    redacting response outputs, and tracking cost ledger.
    """
    gov_repo = SQLAlchemyGovernanceRepository(db)
    user_uuid = uuid.UUID(session.user_id)
    tenant_id = session.tenant_id
    tenant_uuid = uuid.UUID(tenant_id) if tenant_id else None

    # Check for active experiments & traffic splitting
    experiments = []
    if tenant_uuid:
        experiments = await gov_repo.get_active_experiments(tenant_uuid)
    target_model = model_name
    variant_label = "control"
    active_exp = None

    for exp in experiments:
        if exp.experiment_type in ["model", "ab"] and exp.traffic_split:
            active_exp = exp
            # Deterministic split based on user ID
            split_hash = int(hashlib.md5(str(user_uuid).encode()).hexdigest(), 16) % 100
            control_weight = exp.traffic_split.get("control", 0.5) * 100

            if split_hash > control_weight:
                variant_label = "treatment"
                target_model = "gemini-2.0-flash"
            break

    try:
        res = await LLMGateway.call_llm(
            db=db,
            model_name=target_model,
            prompt_input=prompt_input,
            tenant_id=tenant_uuid,
            user_id=user_uuid,
            purpose="online_routing"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    # Return structured details
    return {
        "model_name": res["model_name"],
        "output": res["output"],
        "cost_usd": res["cost_usd"],
        "faithfulness": res["faithfulness"],
        "experiment_active": active_exp is not None,
        "variant": variant_label
    }
