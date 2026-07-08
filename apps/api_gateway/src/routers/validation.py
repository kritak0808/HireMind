import logging
import uuid
from typing import Dict, Optional

import path_setup  # noqa: F401
from auth import get_current_user_session
from db import get_db_session
from events import BaseEvent, RedisEventBus
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from repositories.validation import SQLAlchemyValidationRepository
from security import UserSession
from sqlalchemy.ext.asyncio import AsyncSession
from telemetry import ValidationOrchestrator

logger = logging.getLogger("hiremind.api.validation")
router = APIRouter(prefix="/validation", tags=["QA Validation & Release Certification"])

# --- Request/Response Schemas ---
class ValidationTriggerSchema(BaseModel):
    version: str = Field(..., example="v1.0.0")
    metrics: Dict[str, float] = Field(..., example={"unit_coverage": 85.0, "critical_cves": 0.0, "accessibility_violations": 0.0, "overall_score": 98.0})

class CandidateCreateSchema(BaseModel):
    version: str = Field(..., example="v1.0.0")
    build_number: int = Field(..., example=42)
    config_sha: str = Field(..., example="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")

class ApproveCandidateSchema(BaseModel):
    approver_name: str
    comments: Optional[str] = None
    signature: str

class QualityGateCreateSchema(BaseModel):
    gate_name: str
    metric_name: str # 'unit_coverage', 'critical_cves', 'accessibility_violations'
    threshold_value: float

# --- Router Endpoints ---

@router.get("/runs")
async def list_validation_runs(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyValidationRepository(db)
    return await repo.list_validation_runs()

@router.post("/runs")
async def trigger_validation_run(
    payload: ValidationTriggerSchema,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyValidationRepository(db)
    bus = RedisEventBus()

    # 1. Publish ValidationStarted Event
    corr_id = str(uuid.uuid4())
    event_start = BaseEvent(
        event_type="ValidationStarted",
        tenant_id=session.tenant_id,
        correlation_id=corr_id,
        payload={"version": payload.version}
    )
    await bus.publish(event_start)

    # Fetch active gates
    raw_gates = await repo.get_active_quality_gates(session.tenant_id)
    # Default fallback gates if DB is empty
    if not raw_gates:
        gates = [
            {"gate_name": "Min Unit Coverage", "metric_name": "unit_coverage", "threshold_value": 80.0},
            {"gate_name": "Zero Critical CVEs", "metric_name": "critical_cves", "threshold_value": 0.0},
            {"gate_name": "Accessibility Violations Limit", "metric_name": "accessibility_violations", "threshold_value": 0.0}
        ]
    else:
        gates = [{"gate_name": g.gate_name, "metric_name": g.metric_name, "threshold_value": g.threshold_value} for g in raw_gates]

    # Run orchestrator pipeline
    result = await ValidationOrchestrator.run_pipeline(
        repo=repo,
        tenant_id=session.tenant_id,
        version=payload.version,
        metrics=payload.metrics,
        gates=gates
    )

    # 2. Publish ValidationCompleted event
    event_complete = BaseEvent(
        event_type="ValidationCompleted",
        tenant_id=session.tenant_id,
        correlation_id=corr_id,
        payload={"run_id": result["run_id"], "status": result["status"]}
    )
    await bus.publish(event_complete)

    # 3. Publish QualityGate events based on results
    event_gate_type = "QualityGatePassed" if result["status"] == "passed" else "QualityGateFailed"
    event_gate = BaseEvent(
        event_type=event_gate_type,
        tenant_id=session.tenant_id,
        correlation_id=corr_id,
        payload={"run_id": result["run_id"], "failed_gates": result["gates"]["failed_gates"]}
    )
    await bus.publish(event_gate)

    return result

# --- Release Candidates & Approvals ---

@router.get("/candidates")
async def list_release_candidates(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyValidationRepository(db)
    return await repo.list_release_candidates()

@router.post("/candidates")
async def create_release_candidate(
    payload: CandidateCreateSchema,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyValidationRepository(db)
    rc = await repo.create_release_candidate(
        tenant_id=session.tenant_id,
        version=payload.version,
        build_num=payload.build_number,
        config_sha=payload.config_sha
    )

    # Publish ReleaseCandidateCreated event
    bus = RedisEventBus()
    event = BaseEvent(
        event_type="ReleaseCandidateCreated",
        tenant_id=session.tenant_id,
        correlation_id=str(uuid.uuid4()),
        payload={"candidate_id": str(rc.id), "version": rc.version_string, "build_number": rc.build_number}
    )
    await bus.publish(event)
    return {"status": "created", "candidate_id": str(rc.id)}

@router.post("/candidates/{id}/approve")
async def approve_release_candidate(
    id: uuid.UUID,
    payload: ApproveCandidateSchema,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyValidationRepository(db)
    rc = await repo.update_candidate_status(id, "passed")
    if not rc:
        raise HTTPException(status_code=404, detail="Release Candidate not found")

    await repo.add_release_approval(
        candidate_id=rc.id,
        approver=payload.approver_name,
        signature=payload.signature,
        comments=payload.comments
    )

    # Publish ReleaseApproved event
    bus = RedisEventBus()
    event = BaseEvent(
        event_type="ReleaseApproved",
        tenant_id=session.tenant_id,
        correlation_id=str(uuid.uuid4()),
        payload={"candidate_id": str(rc.id), "approver": payload.approver_name}
    )
    await bus.publish(event)
    return {"status": "approved", "candidate_id": str(rc.id)}

# --- Quality Gates ---

@router.get("/gates")
async def list_quality_gates(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyValidationRepository(db)
    return await repo.get_active_quality_gates(session.tenant_id)

@router.post("/gates")
async def create_quality_gate(
    payload: QualityGateCreateSchema,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyValidationRepository(db)
    gate = await repo.create_quality_gate(
        tenant_id=session.tenant_id,
        name=payload.gate_name,
        metric=payload.metric_name,
        threshold=payload.threshold_value
    )
    return {"status": "success", "gate_id": str(gate.id)}

# --- Findings & Evidence ---

@router.get("/findings/security")
async def list_security_findings(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyValidationRepository(db)
    return await repo.list_security_findings()

@router.get("/findings/accessibility")
async def list_accessibility_findings(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyValidationRepository(db)
    return await repo.list_accessibility_findings()

@router.get("/findings/compliance")
async def list_compliance_findings(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyValidationRepository(db)
    return await repo.list_compliance_findings()

@router.get("/evidence")
async def list_evidence_records(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyValidationRepository(db)
    return await repo.list_evidence()

@router.get("/certifications")
async def list_certifications(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyValidationRepository(db)
    return await repo.list_certifications()

@router.get("/coverage")
async def list_coverage_reports(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyValidationRepository(db)
    return await repo.list_coverage_reports()

@router.get("/regressions")
async def list_regression_reports(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyValidationRepository(db)
    return await repo.list_regression_reports()

@router.get("/metrics")
async def list_validation_metrics(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyValidationRepository(db)
    return await repo.list_validation_metrics()

# --- Simulation Trigger Endpoints ---

@router.post("/simulate/qa")
async def run_comprehensive_qa_simulation(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Triggers simulated security penetrations, coverage reports, and compliance findings.
    """
    repo = SQLAlchemyValidationRepository(db)

    # 1. Log Pen-Testing vulnerabilities ZAP scan
    await repo.create_penetration_report(
        tenant_id=session.tenant_id,
        url="http://hiremind-app-prod:8000/api/v1/jobs",
        scan_type="owasp_zap",
        count=0,
        raw_log="ZAP scan complete. Zero vulnerabilities detected on api post methods."
    )

    # 2. Record Coverage reports
    await repo.record_coverage_report(session.tenant_id, "recruitment-core", 92.4, 88.0, 1420)
    await repo.record_coverage_report(session.tenant_id, "ai-runtime", 88.1, 84.5, 980)

    # 3. Log GDPR Compliance findings
    await repo.record_compliance_finding(
        tenant_id=session.tenant_id,
        framework="gdpr",
        type="data_deletion_consent",
        details="Verified candidate soft-deletion prompts scrubbed logs as required."
    )

    # 4. Record validation metrics
    await repo.record_validation_metric(session.tenant_id, "overall_unit_coverage", 90.25, "%")
    await repo.record_validation_metric(session.tenant_id, "open_critical_cves", 0.0, "count")

    return {
        "status": "success",
        "simulation_details": {
            "penetration_reports_logged": 1,
            "coverage_reports_logged": 2,
            "compliance_findings_logged": 1
        }
    }
