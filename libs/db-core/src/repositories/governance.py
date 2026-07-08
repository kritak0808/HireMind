import hashlib
import json
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from models import (
    AICostRecord,
    AIExperiment,
    ApprovalRequest,
    ComplianceReport,
    DriftReport,
    EvaluationDataset,
    EvaluationReport,
    ExperimentRun,
    GovernanceAuditRecord,
    ModelDefinition,
    ModelDeployment,
    ModelHealthRecord,
    ModelVersion,
    PolicyRule,
    PromptHealthRecord,
    RoutingPolicy,
    SafetyEvent,
)
from sqlalchemy import and_, desc, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select


class SQLAlchemyGovernanceRepository:
    """SQLAlchemy implementation of AI Governance database access."""
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    # --- Models & Registry ---
    async def get_model(self, model_id: uuid.UUID) -> Optional[ModelDefinition]:
        stmt = select(ModelDefinition).where(ModelDefinition.id == model_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_models(self) -> List[ModelDefinition]:
        stmt = select(ModelDefinition).order_by(ModelDefinition.name)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create_model(self, name: str, provider_name: str, description: str, capabilities: List[str] = None, metadata: dict = None) -> ModelDefinition:
        model = ModelDefinition(
            name=name,
            provider_name=provider_name,
            description=description,
            capabilities={"list": capabilities or []},
            metadata_payload=metadata or {},
            organization_id="system" # Global model definition
        )
        self.session.add(model)
        await self.session.flush()
        return model

    async def create_model_version(self, model_id: uuid.UUID, version_string: str, release_status: str = "experimental", is_default: bool = False) -> ModelVersion:
        version = ModelVersion(
            model_id=model_id,
            version_string=version_string,
            release_status=release_status,
            is_default=is_default
        )
        self.session.add(version)
        await self.session.flush()
        return version

    async def get_active_model_deployment(self, model_version_id: uuid.UUID) -> Optional[ModelDeployment]:
        stmt = select(ModelDeployment).where(and_(ModelDeployment.model_version_id == model_version_id, ModelDeployment.status == "active"))
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_model_deployment(self, tenant_id: str, model_version_id: uuid.UUID, deployment_type: str = "production", traffic_weight: float = 1.0) -> ModelDeployment:
        deployment = ModelDeployment(
            organization_id=tenant_id,
            model_version_id=model_version_id,
            deployment_type=deployment_type,
            traffic_weight=traffic_weight,
            status="active"
        )
        self.session.add(deployment)
        await self.session.flush()
        return deployment

    # --- Routing & Policies ---
    async def get_active_routing_policies(self, tenant_id: str) -> List[RoutingPolicy]:
        stmt = select(RoutingPolicy).where(and_(RoutingPolicy.organization_id == tenant_id, RoutingPolicy.is_active))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create_routing_policy(self, tenant_id: str, name: str, rules: dict) -> RoutingPolicy:
        policy = RoutingPolicy(
            organization_id=tenant_id,
            policy_name=name,
            routing_rules=rules,
            is_active=True
        )
        self.session.add(policy)
        await self.session.flush()
        return policy

    # --- Approvals ---
    async def create_approval_request(self, tenant_id: str, request_type: str, target_id: uuid.UUID, target_version: str, requester_id: uuid.UUID) -> ApprovalRequest:
        req = ApprovalRequest(
            organization_id=tenant_id,
            request_type=request_type,
            target_id=target_id,
            target_version=target_version,
            requester_id=requester_id,
            status="pending"
        )
        self.session.add(req)
        await self.session.flush()
        return req

    async def update_approval_status(self, request_id: uuid.UUID, approver_id: uuid.UUID, status: str, comments: str = None) -> Optional[ApprovalRequest]:
        stmt = select(ApprovalRequest).where(ApprovalRequest.id == request_id)
        result = await self.session.execute(stmt)
        req = result.scalar_one_or_none()
        if req:
            req.status = status
            req.approver_id = approver_id
            req.comments = comments
            req.updated_at = datetime.utcnow()
            await self.session.flush()
        return req

    async def list_pending_approvals(self, tenant_id: str) -> List[ApprovalRequest]:
        stmt = select(ApprovalRequest).where(and_(ApprovalRequest.organization_id == tenant_id, ApprovalRequest.status == "pending"))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Experiments ---
    async def create_experiment(self, tenant_id: str, name: str, experiment_type: str, traffic_split: dict, hypothesis: str) -> AIExperiment:
        exp = AIExperiment(
            organization_id=tenant_id,
            name=name,
            experiment_type=experiment_type,
            status="draft",
            traffic_split=traffic_split,
            hypothesis=hypothesis
        )
        self.session.add(exp)
        await self.session.flush()
        return exp

    async def get_active_experiments(self, tenant_id: str) -> List[AIExperiment]:
        stmt = select(AIExperiment).where(and_(AIExperiment.organization_id == tenant_id, AIExperiment.status == "running"))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def record_experiment_run(self, tenant_id: str, experiment_id: uuid.UUID, user_id: uuid.UUID, variant: str, input_payload: dict, output_payload: dict, latency_ms: int, success: bool, metrics: dict) -> ExperimentRun:
        run = ExperimentRun(
            organization_id=tenant_id,
            experiment_id=experiment_id,
            user_id=user_id,
            variant_label=variant,
            input_payload=input_payload,
            output_payload=output_payload,
            latency_ms=latency_ms,
            is_success=success,
            metrics=metrics
        )
        self.session.add(run)
        await self.session.flush()
        return run

    # --- Evaluations ---
    async def create_evaluation_dataset(self, tenant_id: str, name: str, version: str, dataset_type: str, records: List[dict]) -> EvaluationDataset:
        ds = EvaluationDataset(
            organization_id=tenant_id,
            name=name,
            version=version,
            dataset_type=dataset_type,
            records={"data": records}
        )
        self.session.add(ds)
        await self.session.flush()
        return ds

    async def create_evaluation_report(self, tenant_id: str, name: str, dataset_version_id: uuid.UUID, overall_score: float, scores: dict, prompt_version_id: uuid.UUID = None, model_version_id: uuid.UUID = None) -> EvaluationReport:
        report = EvaluationReport(
            organization_id=tenant_id,
            name=name,
            dataset_version_id=dataset_version_id,
            prompt_version_id=prompt_version_id,
            model_version_id=model_version_id,
            overall_score=overall_score,
            scores=scores,
            status="completed"
        )
        self.session.add(report)
        await self.session.flush()
        return report

    async def list_evaluation_reports(self, tenant_id: str) -> List[EvaluationReport]:
        stmt = select(EvaluationReport).where(EvaluationReport.organization_id == tenant_id).order_by(desc(EvaluationReport.created_at))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Safety & Policies ---
    async def record_safety_event(self, tenant_id: str, event_type: str, severity: str, input_content: str, output_content: str, details: dict, action_taken: str) -> SafetyEvent:
        evt = SafetyEvent(
            organization_id=tenant_id,
            event_type=event_type,
            severity=severity,
            input_content=input_content,
            output_content=output_content,
            violation_details=details,
            action_taken=action_taken
        )
        self.session.add(evt)
        await self.session.flush()
        return evt

    async def list_safety_events(self, tenant_id: str) -> List[SafetyEvent]:
        stmt = select(SafetyEvent).where(SafetyEvent.organization_id == tenant_id).order_by(desc(SafetyEvent.created_at))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create_policy_rule(self, tenant_id: str, name: str, rule_type: str, rule_definition: dict) -> PolicyRule:
        rule = PolicyRule(
            organization_id=tenant_id,
            name=name,
            rule_type=rule_type,
            rule_definition=rule_definition,
            is_active=True
        )
        self.session.add(rule)
        await self.session.flush()
        return rule

    async def get_active_policy_rules(self, tenant_id: str) -> List[PolicyRule]:
        stmt = select(PolicyRule).where(and_(PolicyRule.organization_id == tenant_id, PolicyRule.is_active))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Audits & Evidence ---
    async def write_governance_audit(self, tenant_id: str, actor_id: uuid.UUID, action: str, resource_type: str, resource_id: str, prev_state: dict, new_state: dict) -> GovernanceAuditRecord:
        serialized = json.dumps({"action": action, "prev": prev_state, "new": new_state, "time": datetime.utcnow().isoformat()})
        evidence_hash = hashlib.sha256(serialized.encode("utf-8")).hexdigest()

        record = GovernanceAuditRecord(
            organization_id=tenant_id,
            actor_id=actor_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            prev_state=prev_state,
            new_state=new_state,
            evidence_hash=evidence_hash
        )
        self.session.add(record)
        await self.session.flush()
        return record

    async def list_governance_audits(self, tenant_id: str) -> List[GovernanceAuditRecord]:
        stmt = select(GovernanceAuditRecord).where(GovernanceAuditRecord.organization_id == tenant_id).order_by(desc(GovernanceAuditRecord.created_at))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Observability & Costs ---
    async def save_model_health(self, model_name: str, latency: float, error: float, avail: float, throughput: int) -> ModelHealthRecord:
        rec = ModelHealthRecord(
            model_name=model_name,
            latency_p95=latency,
            error_rate=error,
            availability=avail,
            token_throughput=throughput
        )
        self.session.add(rec)
        await self.session.flush()
        return rec

    async def save_prompt_health(self, prompt_name: str, version: str, avg_latency: float, error_rate: float, usage: int) -> PromptHealthRecord:
        rec = PromptHealthRecord(
            prompt_name=prompt_name,
            version=version,
            avg_latency=avg_latency,
            error_rate=error_rate,
            usage_count=usage
        )
        self.session.add(rec)
        await self.session.flush()
        return rec

    async def add_cost_record(self, tenant_id: str, model_name: str, prompt_tokens: int, completion_tokens: int, total_cost: float, purpose: str) -> AICostRecord:
        rec = AICostRecord(
            organization_id=tenant_id,
            model_name=model_name,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_cost=total_cost,
            purpose=purpose
        )
        self.session.add(rec)
        await self.session.flush()
        return rec

    async def get_tenant_costs_aggregate(self, tenant_id: str) -> List[Dict[str, Any]]:
        # Groups and aggregates cost metrics
        stmt = (
            select(
                AICostRecord.model_name,
                func.sum(AICostRecord.prompt_tokens).label("prompt_tokens"),
                func.sum(AICostRecord.completion_tokens).label("completion_tokens"),
                func.sum(AICostRecord.total_cost).label("total_cost"),
                func.count(AICostRecord.id).label("calls_count")
            )
            .where(AICostRecord.organization_id == tenant_id)
            .group_by(AICostRecord.model_name)
        )
        result = await self.session.execute(stmt)
        return [
            {
                "model_name": row[0],
                "prompt_tokens": row[1],
                "completion_tokens": row[2],
                "total_cost": float(row[3]) if row[3] else 0.0,
                "calls_count": row[4]
            }
            for row in result.all()
        ]

    # --- Drift & Compliance ---
    async def create_drift_report(self, tenant_id: str, model_name: str, metric: str, score: float, is_drift: bool, details: dict) -> DriftReport:
        rep = DriftReport(
            organization_id=tenant_id,
            model_name=model_name,
            drift_metric=metric,
            drift_score=score,
            is_drift_detected=is_drift,
            details=details
        )
        self.session.add(rep)
        await self.session.flush()
        return rep

    async def list_drift_reports(self, tenant_id: str) -> List[DriftReport]:
        stmt = select(DriftReport).where(DriftReport.organization_id == tenant_id).order_by(desc(DriftReport.created_at))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create_compliance_report(self, tenant_id: str, report_type: str, score: float, findings: dict, storage_ref: str) -> ComplianceReport:
        rep = ComplianceReport(
            organization_id=tenant_id,
            report_type=report_type,
            score=score,
            findings=findings,
            evidence_storage_ref=storage_ref
        )
        self.session.add(rep)
        await self.session.flush()
        return rep

    async def list_compliance_reports(self, tenant_id: str) -> List[ComplianceReport]:
        stmt = select(ComplianceReport).where(ComplianceReport.organization_id == tenant_id).order_by(desc(ComplianceReport.created_at))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def save(self) -> None:
        await self.session.flush()
