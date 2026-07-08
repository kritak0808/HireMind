import logging
import uuid
from typing import Any, Dict, List, Optional

import path_setup  # noqa: F401
from auth import get_current_user_session
from db import get_db_session
from events import BaseEvent, RedisEventBus
from fastapi import APIRouter, Depends, HTTPException, status
from models import AIExperiment, EvaluationDataset
from pydantic import BaseModel, Field
from repositories.governance import SQLAlchemyGovernanceRepository
from security import UserSession
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("hiremind.api.governance")
router = APIRouter(prefix="/governance", tags=["AI Governance & Operations"])

# --- Request/Response Schemas ---
class ModelRegisterSchema(BaseModel):
    name: str = Field(..., example="gemini-2.0-flash")
    provider_name: str = Field(..., example="gemini")
    description: str
    capabilities: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class ModelVersionSchema(BaseModel):
    version_string: str = Field(..., example="v2.0.1")
    release_status: str = Field(default="experimental")
    is_default: bool = Field(default=False)

class DeploymentSchema(BaseModel):
    model_version_id: str
    deployment_type: str = Field(default="production") # production, canary, shadow
    traffic_weight: float = Field(default=1.0)

class PolicySchema(BaseModel):
    name: str
    rules: Dict[str, Any]

class ApprovalRequestSchema(BaseModel):
    request_type: str # prompt_publish, model_promote
    target_id: str
    target_version: str

class ApprovalActionSchema(BaseModel):
    status: str # approved, rejected
    comments: Optional[str] = None

class ExperimentSchema(BaseModel):
    name: str
    experiment_type: str # ab, canary, shadow, prompt, model
    traffic_split: Dict[str, float]
    hypothesis: str

class ExperimentRunSchema(BaseModel):
    experiment_id: str
    variant: str
    input_payload: Dict[str, Any]
    output_payload: Dict[str, Any]
    latency_ms: int
    success: bool
    metrics: Dict[str, Any]

class DatasetSchema(BaseModel):
    name: str
    version: str
    dataset_type: str
    records: List[Dict[str, Any]]

class EvalReportSchema(BaseModel):
    name: str
    dataset_version_id: str
    prompt_version_id: Optional[str] = None
    model_version_id: Optional[str] = None
    overall_score: float
    scores: Dict[str, Any]

class SafetyEventSchema(BaseModel):
    event_type: str
    severity: str
    input_content: Optional[str] = None
    output_content: Optional[str] = None
    violation_details: Dict[str, Any]
    action_taken: str

class PolicyRuleSchema(BaseModel):
    name: str
    rule_type: str
    rule_definition: Dict[str, Any]

class DriftReportSchema(BaseModel):
    model_name: str
    drift_metric: str
    drift_score: float
    is_drift_detected: bool
    details: Dict[str, Any]

class ComplianceReportSchema(BaseModel):
    report_type: str
    score: float
    findings: Dict[str, Any]
    evidence_storage_ref: str

# Helper Event Publisher
async def publish_governance_event(event_type: str, tenant_id: str, payload: dict):
    try:
        bus = RedisEventBus()
        event = BaseEvent(
            event_type=event_type,
            tenant_id=tenant_id,
            correlation_id=str(uuid.uuid4()),
            payload=payload
        )
        await bus.publish(event)
    except Exception as e:
        logger.error(f"Failed to publish governance event {event_type}: {str(e)}")

# --- Endpoints ---

@router.get("/models")
async def list_models(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyGovernanceRepository(db)
    models = await repo.list_models()
    return [{
        "id": str(m.id),
        "name": m.name,
        "provider_name": m.provider_name,
        "description": m.description,
        "capabilities": m.capabilities.get("list", []),
        "is_active": m.is_active,
        "metadata": m.metadata_payload,
        "tags": m.tags,
        "created_at": m.created_at.isoformat()
    } for m in models]

@router.post("/models", status_code=status.HTTP_201_CREATED)
async def register_model(
    payload: ModelRegisterSchema,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyGovernanceRepository(db)
    model = await repo.create_model(
        name=payload.name,
        provider_name=payload.provider_name,
        description=payload.description,
        capabilities=payload.capabilities,
        metadata=payload.metadata
    )

    await repo.write_governance_audit(
        tenant_id=session.tenant_id,
        actor_id=uuid.UUID(session.user_id),
        action="ModelRegistered",
        resource_type="model",
        resource_id=str(model.id),
        prev_state={},
        new_state=payload.model_dump()
    )

    await publish_governance_event("model.registered", session.tenant_id, {"model_id": str(model.id), "name": model.name})
    await db.commit()
    return {"id": str(model.id), "name": model.name}

@router.post("/models/{model_id}/versions", status_code=status.HTTP_201_CREATED)
async def add_model_version(
    model_id: str,
    payload: ModelVersionSchema,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyGovernanceRepository(db)
    version = await repo.create_model_version(
        model_id=uuid.UUID(model_id),
        version_string=payload.version_string,
        release_status=payload.release_status,
        is_default=payload.is_default
    )

    await repo.write_governance_audit(
        tenant_id=session.tenant_id,
        actor_id=uuid.UUID(session.user_id),
        action="ModelVersionCreated",
        resource_type="model_version",
        resource_id=str(version.id),
        prev_state={},
        new_state=payload.model_dump()
    )

    await db.commit()
    return {"id": str(version.id), "version_string": version.version_string}

@router.post("/deployments", status_code=status.HTTP_201_CREATED)
async def create_deployment(
    payload: DeploymentSchema,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyGovernanceRepository(db)
    dep = await repo.create_model_deployment(
        tenant_id=session.tenant_id,
        model_version_id=uuid.UUID(payload.model_version_id),
        deployment_type=payload.deployment_type,
        traffic_weight=payload.traffic_weight
    )

    await repo.write_governance_audit(
        tenant_id=session.tenant_id,
        actor_id=uuid.UUID(session.user_id),
        action="ModelDeploymentCreated",
        resource_type="deployment",
        resource_id=str(dep.id),
        prev_state={},
        new_state=payload.model_dump()
    )

    await publish_governance_event("model.promoted", session.tenant_id, {"deployment_id": str(dep.id), "type": dep.deployment_type})
    await db.commit()
    return {"id": str(dep.id), "status": dep.status}

@router.get("/routing-policies")
async def list_policies(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyGovernanceRepository(db)
    policies = await repo.get_active_routing_policies(session.tenant_id)
    return [{
        "id": str(p.id),
        "name": p.policy_name,
        "rules": p.routing_rules,
        "is_active": p.is_active,
        "created_at": p.created_at.isoformat()
    } for p in policies]

@router.post("/routing-policies", status_code=status.HTTP_201_CREATED)
async def create_policy(
    payload: PolicySchema,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyGovernanceRepository(db)
    policy = await repo.create_routing_policy(
        tenant_id=session.tenant_id,
        name=payload.name,
        rules=payload.rules
    )

    await repo.write_governance_audit(
        tenant_id=session.tenant_id,
        actor_id=uuid.UUID(session.user_id),
        action="RoutingPolicyCreated",
        resource_type="routing_policy",
        resource_id=str(policy.id),
        prev_state={},
        new_state=payload.model_dump()
    )

    await publish_governance_event("policy.updated", session.tenant_id, {"policy_id": str(policy.id)})
    await db.commit()
    return {"id": str(policy.id), "name": policy.policy_name}

@router.get("/approvals")
async def list_approvals(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyGovernanceRepository(db)
    reqs = await repo.list_pending_approvals(session.tenant_id)
    return [{
        "id": str(r.id),
        "request_type": r.request_type,
        "target_id": str(r.target_id),
        "target_version": r.target_version,
        "requester_id": str(r.requester_id),
        "status": r.status,
        "created_at": r.created_at.isoformat()
    } for r in reqs]

@router.post("/approvals", status_code=status.HTTP_201_CREATED)
async def create_approval(
    payload: ApprovalRequestSchema,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyGovernanceRepository(db)
    req = await repo.create_approval_request(
        tenant_id=session.tenant_id,
        request_type=payload.request_type,
        target_id=uuid.UUID(payload.target_id),
        target_version=payload.target_version,
        requester_id=uuid.UUID(session.user_id)
    )
    await db.commit()
    return {"id": str(req.id), "status": req.status}

@router.post("/approvals/{request_id}/action")
async def take_approval_action(
    request_id: str,
    payload: ApprovalActionSchema,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyGovernanceRepository(db)
    req = await repo.update_approval_status(
        request_id=uuid.UUID(request_id),
        approver_id=uuid.UUID(session.user_id),
        status=payload.status,
        comments=payload.comments
    )
    if not req:
        raise HTTPException(status_code=404, detail="Approval request not found")

    await repo.write_governance_audit(
        tenant_id=session.tenant_id,
        actor_id=uuid.UUID(session.user_id),
        action="ApprovalExecuted",
        resource_type="approval",
        resource_id=request_id,
        prev_state={"status": "pending"},
        new_state={"status": payload.status, "comments": payload.comments}
    )

    event_type = "approval.granted" if payload.status == "approved" else "approval.rejected"
    await publish_governance_event(event_type, session.tenant_id, {"request_id": request_id, "target_id": str(req.target_id)})

    await db.commit()
    return {"id": str(req.id), "status": req.status}

@router.get("/experiments")
async def list_experiments(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    SQLAlchemyGovernanceRepository(db)
    stmt = select(AIExperiment).where(AIExperiment.organization_id == session.tenant_id)
    result = await db.execute(stmt)
    exps = result.scalars().all()
    return [{
        "id": str(e.id),
        "name": e.name,
        "experiment_type": e.experiment_type,
        "status": e.status,
        "traffic_split": e.traffic_split,
        "hypothesis": e.hypothesis,
        "winner_version_id": str(e.winner_version_id) if e.winner_version_id else None,
        "created_at": e.created_at.isoformat()
    } for e in exps]

@router.post("/experiments", status_code=status.HTTP_201_CREATED)
async def create_experiment(
    payload: ExperimentSchema,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyGovernanceRepository(db)
    exp = await repo.create_experiment(
        tenant_id=session.tenant_id,
        name=payload.name,
        experiment_type=payload.experiment_type,
        traffic_split=payload.traffic_split,
        hypothesis=payload.hypothesis
    )

    # Auto transition to running in this simple flow
    exp.status = "running"

    await repo.write_governance_audit(
        tenant_id=session.tenant_id,
        actor_id=uuid.UUID(session.user_id),
        action="ExperimentStarted",
        resource_type="experiment",
        resource_id=str(exp.id),
        prev_state={},
        new_state=payload.model_dump()
    )

    await publish_governance_event("experiment.started", session.tenant_id, {"experiment_id": str(exp.id)})
    await db.commit()
    return {"id": str(exp.id), "status": exp.status}

@router.post("/experiments/runs", status_code=status.HTTP_201_CREATED)
async def record_run(
    payload: ExperimentRunSchema,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyGovernanceRepository(db)
    run = await repo.record_experiment_run(
        tenant_id=session.tenant_id,
        experiment_id=uuid.UUID(payload.experiment_id),
        user_id=uuid.UUID(session.user_id),
        variant=payload.variant,
        input_payload=payload.input_payload,
        output_payload=payload.output_payload,
        latency_ms=payload.latency_ms,
        success=payload.success,
        metrics=payload.metrics
    )
    await db.commit()
    return {"id": str(run.id)}

@router.post("/evaluations/datasets", status_code=status.HTTP_201_CREATED)
async def create_dataset(
    payload: DatasetSchema,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyGovernanceRepository(db)
    ds = await repo.create_evaluation_dataset(
        tenant_id=session.tenant_id,
        name=payload.name,
        version=payload.version,
        dataset_type=payload.dataset_type,
        records=payload.records
    )
    await db.commit()
    return {"id": str(ds.id), "name": ds.name, "version": ds.version}

@router.get("/evaluations/datasets")
async def list_datasets(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    SQLAlchemyGovernanceRepository(db)
    stmt = select(EvaluationDataset).where(EvaluationDataset.organization_id == session.tenant_id)
    result = await db.execute(stmt)
    datasets = result.scalars().all()
    return [{
        "id": str(d.id),
        "name": d.name,
        "version": d.version,
        "dataset_type": d.dataset_type,
        "records": d.records.get("data", [])
    } for d in datasets]

@router.post("/evaluations/reports", status_code=status.HTTP_201_CREATED)
async def create_evaluation_report(
    payload: EvalReportSchema,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyGovernanceRepository(db)
    rep = await repo.create_evaluation_report(
        tenant_id=session.tenant_id,
        name=payload.name,
        dataset_version_id=uuid.UUID(payload.dataset_version_id),
        overall_score=payload.overall_score,
        scores=payload.scores,
        prompt_version_id=uuid.UUID(payload.prompt_version_id) if payload.prompt_version_id else None,
        model_version_id=uuid.UUID(payload.model_version_id) if payload.model_version_id else None
    )

    await publish_governance_event("evaluation.finished", session.tenant_id, {"report_id": str(rep.id), "score": rep.overall_score})
    await db.commit()
    return {"id": str(rep.id), "score": rep.overall_score}

@router.get("/evaluations/reports")
async def list_evaluation_reports(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyGovernanceRepository(db)
    reports = await repo.list_evaluation_reports(session.tenant_id)
    return [{
        "id": str(r.id),
        "name": r.name,
        "overall_score": r.overall_score,
        "scores": r.scores,
        "created_at": r.created_at.isoformat()
    } for r in reports]

@router.get("/safety-events")
async def list_safety_events(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyGovernanceRepository(db)
    events = await repo.list_safety_events(session.tenant_id)
    return [{
        "id": str(e.id),
        "event_type": e.event_type,
        "severity": e.severity,
        "input_content": e.input_content,
        "output_content": e.output_content,
        "action_taken": e.action_taken,
        "details": e.violation_details,
        "created_at": e.created_at.isoformat()
    } for e in events]

@router.post("/safety-events", status_code=status.HTTP_201_CREATED)
async def create_safety_event(
    payload: SafetyEventSchema,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyGovernanceRepository(db)
    evt = await repo.record_safety_event(
        tenant_id=session.tenant_id,
        event_type=payload.event_type,
        severity=payload.severity,
        input_content=payload.input_content,
        output_content=payload.output_content,
        details=payload.violation_details,
        action_taken=payload.action_taken
    )

    await publish_governance_event("safety.violation_detected", session.tenant_id, {"event_type": evt.event_type, "severity": evt.severity})
    await db.commit()
    return {"id": str(evt.id)}

@router.get("/policy-rules")
async def list_policy_rules(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyGovernanceRepository(db)
    rules = await repo.get_active_policy_rules(session.tenant_id)
    return [{
        "id": str(r.id),
        "name": r.name,
        "rule_type": r.rule_type,
        "rule_definition": r.rule_definition,
        "is_active": r.is_active
    } for r in rules]

@router.post("/policy-rules", status_code=status.HTTP_201_CREATED)
async def create_policy_rule(
    payload: PolicyRuleSchema,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyGovernanceRepository(db)
    rule = await repo.create_policy_rule(
        tenant_id=session.tenant_id,
        name=payload.name,
        rule_type=payload.rule_type,
        rule_definition=payload.rule_definition
    )
    await db.commit()
    return {"id": str(rule.id), "name": rule.name}

@router.get("/audits")
async def list_audits(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyGovernanceRepository(db)
    audits = await repo.list_governance_audits(session.tenant_id)
    return [{
        "id": str(a.id),
        "actor_id": str(a.actor_id),
        "action": a.action,
        "resource_type": a.resource_type,
        "resource_id": a.resource_id,
        "prev_state": a.prev_state,
        "new_state": a.new_state,
        "evidence_hash": a.evidence_hash,
        "created_at": a.created_at.isoformat()
    } for a in audits]

@router.get("/costs")
async def get_costs(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyGovernanceRepository(db)
    costs = await repo.get_tenant_costs_aggregate(session.tenant_id)
    return costs

@router.get("/drift")
async def list_drift(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyGovernanceRepository(db)
    reports = await repo.list_drift_reports(session.tenant_id)
    return [{
        "id": str(r.id),
        "model_name": r.model_name,
        "drift_metric": r.drift_metric,
        "drift_score": r.drift_score,
        "is_drift_detected": r.is_drift_detected,
        "details": r.details,
        "created_at": r.created_at.isoformat()
    } for r in reports]

@router.post("/drift", status_code=status.HTTP_201_CREATED)
async def create_drift_report(
    payload: DriftReportSchema,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyGovernanceRepository(db)
    rep = await repo.create_drift_report(
        tenant_id=session.tenant_id,
        model_name=payload.model_name,
        metric=payload.drift_metric,
        score=payload.drift_score,
        is_drift=payload.is_drift_detected,
        details=payload.details
    )
    if rep.is_drift_detected:
        await publish_governance_event("drift.detected", session.tenant_id, {"model_name": rep.model_name, "score": rep.drift_score})
    await db.commit()
    return {"id": str(rep.id)}

@router.get("/compliance")
async def list_compliance(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyGovernanceRepository(db)
    reps = await repo.list_compliance_reports(session.tenant_id)
    return [{
        "id": str(r.id),
        "report_type": r.report_type,
        "score": r.score,
        "findings": r.findings,
        "evidence_storage_ref": r.evidence_storage_ref,
        "created_at": r.created_at.isoformat()
    } for r in reps]

@router.post("/compliance", status_code=status.HTTP_201_CREATED)
async def create_compliance_report(
    payload: ComplianceReportSchema,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyGovernanceRepository(db)
    rep = await repo.create_compliance_report(
        tenant_id=session.tenant_id,
        report_type=payload.report_type,
        score=payload.score,
        findings=payload.findings,
        storage_ref=payload.evidence_storage_ref
    )
    await db.commit()
    return {"id": str(rep.id), "score": rep.score}
