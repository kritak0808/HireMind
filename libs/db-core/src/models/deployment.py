import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base_model import Base, TenantModelMixin


class DeploymentRecord(Base, TenantModelMixin):
    __tablename__ = "ops_deployment_records"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    version_string: Mapped[str] = mapped_column(String(50), nullable=False)
    environment: Mapped[str] = mapped_column(String(50), nullable=False) # 'production', 'staging'
    status: Mapped[str] = mapped_column(String(30), default="started") # 'started', 'completed', 'failed'
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

class ReleaseRecord(Base, TenantModelMixin):
    __tablename__ = "ops_release_records"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    version_string: Mapped[str] = mapped_column(String(50), nullable=False)
    git_tag: Mapped[str] = mapped_column(String(50), nullable=False)
    build_number: Mapped[int] = mapped_column(Integer, nullable=False)
    released_by: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="published")
    released_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    notes: Mapped[List["ReleaseNote"]] = relationship("ReleaseNote", back_populates="release", cascade="all, delete-orphan")

class ReleaseNote(Base):
    __tablename__ = "ops_release_notes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    release_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ops_release_records.id", ondelete="CASCADE"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    release: Mapped[ReleaseRecord] = relationship("ReleaseRecord", back_populates="notes")

class RollbackHistory(Base, TenantModelMixin):
    __tablename__ = "ops_rollback_history"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    deployment_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ops_deployment_records.id", ondelete="CASCADE"), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    triggered_by: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="pending") # 'pending', 'success', 'failed'
    executed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class ProductionEnvironment(Base, TenantModelMixin):
    __tablename__ = "ops_production_environments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    env_name: Mapped[str] = mapped_column(String(50), nullable=False) # 'prod-us', 'prod-eu'
    base_url: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    health_status: Mapped[str] = mapped_column(String(30), default="healthy")

class InfrastructureSnapshot(Base, TenantModelMixin):
    __tablename__ = "ops_infrastructure_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    config_sha: Mapped[str] = mapped_column(String(64), nullable=False)
    details: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class IncidentRecord(Base, TenantModelMixin):
    __tablename__ = "ops_incident_records"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(String(30), nullable=False) # 'low', 'medium', 'high', 'critical'
    status: Mapped[str] = mapped_column(String(30), default="open") # 'open', 'resolved'
    triggered_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

class MaintenanceWindow(Base, TenantModelMixin):
    __tablename__ = "ops_maintenance_windows"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

class DeploymentApproval(Base):
    __tablename__ = "ops_deployment_approvals"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    deployment_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ops_deployment_records.id", ondelete="CASCADE"), nullable=False)
    approver_name: Mapped[str] = mapped_column(String(100), nullable=False)
    comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    approved_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class BackupRecord(Base, TenantModelMixin):
    __tablename__ = "ops_backup_records"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    backup_type: Mapped[str] = mapped_column(String(30), nullable=False) # 'full', 'incremental'
    file_path: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="completed")
    file_size_bytes: Mapped[int] = mapped_column(Integer, default=0)
    completed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class DeploymentRecoveryExecution(Base, TenantModelMixin):
    __tablename__ = "ops_recovery_executions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    recovery_plan_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="started")
    details: Mapped[dict] = mapped_column(JSON, default=dict)
    executed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class StatusReport(Base, TenantModelMixin):
    __tablename__ = "ops_status_reports"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    overall_status: Mapped[str] = mapped_column(String(30), default="healthy")
    details: Mapped[dict] = mapped_column(JSON, default=dict)
    reported_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class OperationalMetric(Base, TenantModelMixin):
    __tablename__ = "ops_operational_metrics"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    metric_name: Mapped[str] = mapped_column(String(100), nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(20), nullable=False) # '%', 'count', 'ms'
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class RunbookExecution(Base, TenantModelMixin):
    __tablename__ = "ops_runbook_executions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    runbook_name: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="success") # 'success', 'failed'
    logs: Mapped[str] = mapped_column(Text, nullable=False)
    executed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class ReleaseEvidence(Base, TenantModelMixin):
    __tablename__ = "ops_release_evidences"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    release_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ops_release_records.id", ondelete="CASCADE"), nullable=False)
    evidence_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_path: Mapped[str] = mapped_column(String(255), nullable=False)
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
