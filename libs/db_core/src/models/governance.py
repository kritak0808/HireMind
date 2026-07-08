import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base_model import Base, TenantModelMixin


class ModelDefinition(Base, TenantModelMixin):
    __tablename__ = "ai_model_definitions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    provider_name: Mapped[str] = mapped_column(String(50), nullable=False) # 'openai', 'gemini', 'claude'
    description: Mapped[str] = mapped_column(Text, nullable=False)
    capabilities: Mapped[dict] = mapped_column(JSON, default=dict) # ['resume_parsing', 'code_eval']
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    metadata_payload: Mapped[dict] = mapped_column(JSON, default=dict)
    tags: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    versions: Mapped[list["ModelVersion"]] = relationship("ModelVersion", back_populates="model", cascade="all, delete-orphan")

class ModelVersion(Base):
    __tablename__ = "ai_model_versions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    model_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ai_model_definitions.id", ondelete="CASCADE"), nullable=False)
    version_string: Mapped[str] = mapped_column(String(50), nullable=False)
    release_status: Mapped[str] = mapped_column(String(30), default="experimental") # 'experimental', 'canary', 'production'
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    model: Mapped[ModelDefinition] = relationship("ModelDefinition", back_populates="versions")
    deployments: Mapped[list["ModelDeployment"]] = relationship("ModelDeployment", back_populates="model_version", cascade="all, delete-orphan")

class ModelDeployment(Base, TenantModelMixin):
    __tablename__ = "ai_model_deployments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    model_version_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ai_model_versions.id", ondelete="CASCADE"), nullable=False)
    deployment_type: Mapped[str] = mapped_column(String(30), default="production") # 'production', 'canary', 'shadow'
    traffic_weight: Mapped[float] = mapped_column(Float, default=1.0)
    status: Mapped[str] = mapped_column(String(30), default="active") # 'active', 'inactive'
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    model_version: Mapped[ModelVersion] = relationship("ModelVersion", back_populates="deployments")

class RoutingPolicy(Base, TenantModelMixin):
    __tablename__ = "ai_routing_policies"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    policy_name: Mapped[str] = mapped_column(String(100), nullable=False)
    routing_rules: Mapped[dict] = mapped_column(JSON, default=dict) # priority logic, fallbacks
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class ApprovalRequest(Base, TenantModelMixin):
    __tablename__ = "ai_approval_requests"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    request_type: Mapped[str] = mapped_column(String(50), nullable=False) # 'prompt_publish', 'model_promote'
    target_id: Mapped[uuid.UUID] = mapped_column(nullable=False) # Target version UUID
    target_version: Mapped[str] = mapped_column(String(50), nullable=False)
    requester_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    approver_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="pending") # 'pending', 'approved', 'rejected'
    comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AIExperiment(Base, TenantModelMixin):
    __tablename__ = "ai_experiments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    experiment_type: Mapped[str] = mapped_column(String(50), nullable=False) # 'ab', 'canary', 'shadow', 'prompt', 'model'
    status: Mapped[str] = mapped_column(String(30), default="draft") # 'draft', 'running', 'completed', 'rolled_back'
    traffic_split: Mapped[dict] = mapped_column(JSON, default=dict) # {'control': 0.5, 'treatment': 0.5}
    hypothesis: Mapped[str] = mapped_column(Text, nullable=False)
    winner_version_id: Mapped[Optional[uuid.UUID]] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    runs: Mapped[list["ExperimentRun"]] = relationship("ExperimentRun", back_populates="experiment", cascade="all, delete-orphan")

class ExperimentRun(Base, TenantModelMixin):
    __tablename__ = "ai_experiment_runs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    experiment_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ai_experiments.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    variant_label: Mapped[str] = mapped_column(String(50), nullable=False) # 'control', 'treatment'
    input_payload: Mapped[dict] = mapped_column(JSON, default=dict)
    output_payload: Mapped[dict] = mapped_column(JSON, default=dict)
    latency_ms: Mapped[int] = mapped_column(Integer, default=0)
    is_success: Mapped[bool] = mapped_column(Boolean, default=True)
    metrics: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    experiment: Mapped[AIExperiment] = relationship("AIExperiment", back_populates="runs")

class EvaluationDataset(Base, TenantModelMixin):
    __tablename__ = "ai_evaluation_datasets"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    dataset_type: Mapped[str] = mapped_column(String(50), default="golden_set") # 'golden_set', 'regression'
    records: Mapped[dict] = mapped_column(JSON, default=dict) # list of inputs and expected outputs
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class EvaluationReport(Base, TenantModelMixin):
    __tablename__ = "ai_evaluation_reports"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    dataset_version_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ai_evaluation_datasets.id", ondelete="CASCADE"), nullable=False)
    prompt_version_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("ai_prompt_versions.id", ondelete="SET NULL"), nullable=True)
    model_version_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("ai_model_versions.id", ondelete="SET NULL"), nullable=True)
    overall_score: Mapped[float] = mapped_column(Float, default=0.0)
    scores: Mapped[dict] = mapped_column(JSON, default=dict) # helpfulness, latency, correctness, safety, cost
    status: Mapped[str] = mapped_column(String(30), default="completed") # 'completed', 'failed'
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class BenchmarkResult(Base, TenantModelMixin):
    __tablename__ = "ai_benchmark_results"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    benchmark_type: Mapped[str] = mapped_column(String(100), nullable=False) # 'MMLU', 'GSM8K', 'custom'
    score: Mapped[float] = mapped_column(Float, nullable=False)
    metadata_payload: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class SafetyEvent(Base, TenantModelMixin):
    __tablename__ = "ai_safety_events"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False) # 'prompt_injection', 'jailbreak', 'pii_leak'
    severity: Mapped[str] = mapped_column(String(20), nullable=False) # 'low', 'medium', 'high', 'critical'
    input_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    output_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    violation_details: Mapped[dict] = mapped_column(JSON, default=dict)
    action_taken: Mapped[str] = mapped_column(String(30), default="logged") # 'blocked', 'redacted', 'logged'
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class PolicyRule(Base, TenantModelMixin):
    __tablename__ = "ai_policy_rules"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    rule_type: Mapped[str] = mapped_column(String(50), nullable=False) # 'blocklist', 'pii_redact', 'model_access'
    rule_definition: Mapped[dict] = mapped_column(JSON, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class GovernanceAuditRecord(Base, TenantModelMixin):
    __tablename__ = "ai_governance_audit_records"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    actor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False) # 'prompt', 'model_policy', 'routing'
    resource_id: Mapped[str] = mapped_column(String(100), nullable=False)
    prev_state: Mapped[dict] = mapped_column(JSON, default=dict)
    new_state: Mapped[dict] = mapped_column(JSON, default=dict)
    evidence_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class ModelHealthRecord(Base):
    __tablename__ = "ai_model_health_records"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    latency_p95: Mapped[float] = mapped_column(Float, default=0.0)
    error_rate: Mapped[float] = mapped_column(Float, default=0.0)
    availability: Mapped[float] = mapped_column(Float, default=1.0)
    token_throughput: Mapped[int] = mapped_column(Integer, default=0)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class PromptHealthRecord(Base):
    __tablename__ = "ai_prompt_health_records"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    prompt_name: Mapped[str] = mapped_column(String(100), nullable=False)
    version: Mapped[str] = mapped_column(String(30), nullable=False)
    avg_latency: Mapped[float] = mapped_column(Float, default=0.0)
    error_rate: Mapped[float] = mapped_column(Float, default=0.0)
    usage_count: Mapped[int] = mapped_column(Integer, default=0)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class AICostRecord(Base, TenantModelMixin):
    __tablename__ = "ai_cost_records"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    prompt_tokens: Mapped[int] = mapped_column(Integer, default=0)
    completion_tokens: Mapped[int] = mapped_column(Integer, default=0)
    total_cost: Mapped[float] = mapped_column(Numeric(12, 6), default=0.0)
    purpose: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. 'resume_parsing', 'interview_chat'
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class DriftReport(Base, TenantModelMixin):
    __tablename__ = "ai_drift_reports"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    drift_metric: Mapped[str] = mapped_column(String(50), nullable=False) # 'psi', 'cosine_similarity'
    drift_score: Mapped[float] = mapped_column(Float, default=0.0)
    is_drift_detected: Mapped[bool] = mapped_column(Boolean, default=False)
    details: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class ComplianceReport(Base, TenantModelMixin):
    __tablename__ = "ai_compliance_reports"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    report_type: Mapped[str] = mapped_column(String(50), nullable=False) # 'gdpr', 'soc2', 'ai_act'
    score: Mapped[float] = mapped_column(Float, default=1.0)
    findings: Mapped[dict] = mapped_column(JSON, default=dict)
    evidence_storage_ref: Mapped[str] = mapped_column(String(200), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class ArtifactReference(Base, TenantModelMixin):
    __tablename__ = "ai_artifact_references"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(250), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(50), nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
