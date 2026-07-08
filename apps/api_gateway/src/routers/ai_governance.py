import logging
import re
import uuid

import path_setup  # noqa: F401
from auth import get_current_user_session
from db import get_db_session
from fastapi import APIRouter, Depends
from models import ModelDefinition, PromptTemplate, PromptVersion, SafetyEvent
from pydantic import BaseModel
from security import UserSession
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("hiremind.api.ai_governance")
router = APIRouter(prefix="/ai-governance", tags=["AI Governance Framework"])


class PromptVersionPayload(BaseModel):
    name: str
    description: str
    content: str
    version_number: int


class SafetyScanPayload(BaseModel):
    prompt_content: str


@router.get("/prompts")
async def get_prompt_registry(
    db: AsyncSession = Depends(get_db_session)
):
    stmt = select(PromptTemplate)
    res = await db.execute(stmt)
    templates = res.scalars().all()
    
    return [
        {
            "id": str(t.id),
            "name": t.name,
            "description": t.description,
            "created_at": t.created_at.isoformat()
        }
        for t in templates
    ]


@router.post("/prompts")
async def create_prompt_version(
    payload: PromptVersionPayload,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    # Retrieve template or create
    stmt = select(PromptTemplate).where(PromptTemplate.name == payload.name)
    res = await db.execute(stmt)
    template = res.scalar_one_or_none()

    if not template:
        template = PromptTemplate(
            name=payload.name,
            description=payload.description
        )
        db.add(template)
        await db.commit()
        await db.refresh(template)

    new_version = PromptVersion(
        template_id=template.id,
        version_number=payload.version_number,
        template_content=payload.content,
        is_active=True
    )
    db.add(new_version)
    
    # Audit log
    from models import AuditLog
    audit = AuditLog(
        tenant_id=session.tenant_id,
        actor_id=uuid.UUID(session.user_id),
        action="prompt_version_registered",
        resource="ai_prompts",
        payload={
            "prompt_name": payload.name,
            "version_number": payload.version_number
        }
    )
    db.add(audit)
    await db.commit()

    return {"status": "saved", "version_id": str(new_version.id)}


@router.get("/models")
async def get_model_registry(
    db: AsyncSession = Depends(get_db_session)
):
    stmt = select(ModelDefinition)
    res = await db.execute(stmt)
    models = res.scalars().all()

    return [
        {
            "id": str(m.id),
            "name": m.name,
            "provider_name": m.provider_name,
            "description": m.description,
            "is_active": m.is_active
        }
        for m in models
    ]


@router.post("/safety/scan")
async def scan_prompt_safety(
    payload: SafetyScanPayload,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    text = payload.prompt_content

    # 1. Simple PII Detection: look for credit cards or phone patterns
    has_pii = bool(re.search(r"\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b", text))
    redacted = re.sub(r"\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b", "[REDACTED_CC]", text)

    # 2. Simple Jailbreak/Injection Detection: adversarial prompts phrases
    has_injection = "ignore previous instructions" in text.lower() or "system bypass" in text.lower()

    if has_pii or has_injection:
        event = SafetyEvent(
            organization_id=session.tenant_id,
            event_type="pii_leak" if has_pii else "prompt_injection",
            severity="high" if has_injection else "medium",
            input_content=text,
            output_content=redacted,
            violation_details={"pii_detected": has_pii, "injection_detected": has_injection},
            action_taken="redacted" if has_pii else "blocked"
        )
        db.add(event)
        await db.commit()

    return {
        "status": "passed" if not has_injection else "blocked",
        "pii_detected": has_pii,
        "prompt_injection_detected": has_injection,
        "clean_content": redacted
    }
