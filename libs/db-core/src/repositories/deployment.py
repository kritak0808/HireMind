import uuid
from datetime import datetime
from typing import List, Optional

from models import (
    BackupRecord,
    DeploymentApproval,
    DeploymentRecord,
    DeploymentRecoveryExecution,
    IncidentRecord,
    InfrastructureSnapshot,
    MaintenanceWindow,
    OperationalMetric,
    ProductionEnvironment,
    ReleaseEvidence,
    ReleaseNote,
    ReleaseRecord,
    RollbackHistory,
    RunbookExecution,
    StatusReport,
)
from sqlalchemy import and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select


class SQLAlchemyDeploymentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    # --- Deployments ---
    async def create_deployment_record(self, tenant_id: str, version: str, environment: str) -> DeploymentRecord:
        record = DeploymentRecord(
            organization_id=tenant_id,
            version_string=version,
            environment=environment,
            status="started"
        )
        self.session.add(record)
        await self.session.flush()
        return record

    async def complete_deployment_record(self, deployment_id: uuid.UUID, status: str) -> Optional[DeploymentRecord]:
        stmt = select(DeploymentRecord).where(DeploymentRecord.id == deployment_id)
        result = await self.session.execute(stmt)
        record = result.scalar_one_or_none()
        if record:
            record.status = status
            record.completed_at = datetime.utcnow()
            await self.session.flush()
        return record

    async def list_deployments(self) -> List[DeploymentRecord]:
        stmt = select(DeploymentRecord).order_by(desc(DeploymentRecord.started_at))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Releases & Notes ---
    async def create_release_record(self, tenant_id: str, version: str, git_tag: str, build_number: int, released_by: str) -> ReleaseRecord:
        release = ReleaseRecord(
            organization_id=tenant_id,
            version_string=version,
            git_tag=git_tag,
            build_number=build_number,
            released_by=released_by
        )
        self.session.add(release)
        await self.session.flush()
        return release

    async def create_release_note(self, release_id: uuid.UUID, content: str) -> ReleaseNote:
        note = ReleaseNote(
            release_id=release_id,
            content=content
        )
        self.session.add(note)
        await self.session.flush()
        return note

    async def list_releases(self) -> List[ReleaseRecord]:
        stmt = select(ReleaseRecord).order_by(desc(ReleaseRecord.released_at))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Rollbacks ---
    async def record_rollback(self, tenant_id: str, deployment_id: uuid.UUID, reason: str, triggered_by: str) -> RollbackHistory:
        rb = RollbackHistory(
            organization_id=tenant_id,
            deployment_id=deployment_id,
            reason=reason,
            triggered_by=triggered_by,
            status="pending"
        )
        self.session.add(rb)
        await self.session.flush()
        return rb

    async def update_rollback_status(self, rollback_id: uuid.UUID, status: str) -> Optional[RollbackHistory]:
        stmt = select(RollbackHistory).where(RollbackHistory.id == rollback_id)
        result = await self.session.execute(stmt)
        rb = result.scalar_one_or_none()
        if rb:
            rb.status = status
            await self.session.flush()
        return rb

    async def list_rollbacks(self) -> List[RollbackHistory]:
        stmt = select(RollbackHistory).order_by(desc(RollbackHistory.executed_at))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Environments ---
    async def create_environment(self, tenant_id: str, env_name: str, base_url: str) -> ProductionEnvironment:
        env = ProductionEnvironment(
            organization_id=tenant_id,
            env_name=env_name,
            base_url=base_url
        )
        self.session.add(env)
        await self.session.flush()
        return env

    async def get_active_environments(self, tenant_id: str) -> List[ProductionEnvironment]:
        stmt = select(ProductionEnvironment).where(and_(ProductionEnvironment.organization_id == tenant_id, ProductionEnvironment.is_active))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Infra Snapshots ---
    async def record_infra_snapshot(self, tenant_id: str, config_sha: str, details: dict) -> InfrastructureSnapshot:
        snap = InfrastructureSnapshot(
            organization_id=tenant_id,
            config_sha=config_sha,
            details=details
        )
        self.session.add(snap)
        await self.session.flush()
        return snap

    # --- Incidents ---
    async def record_incident(self, tenant_id: str, title: str, description: str, severity: str) -> IncidentRecord:
        inc = IncidentRecord(
            organization_id=tenant_id,
            title=title,
            description=description,
            severity=severity,
            status="open"
        )
        self.session.add(inc)
        await self.session.flush()
        return inc

    async def resolve_incident(self, incident_id: uuid.UUID) -> Optional[IncidentRecord]:
        stmt = select(IncidentRecord).where(IncidentRecord.id == incident_id)
        result = await self.session.execute(stmt)
        inc = result.scalar_one_or_none()
        if inc:
            inc.status = "resolved"
            inc.resolved_at = datetime.utcnow()
            await self.session.flush()
        return inc

    async def list_incidents(self) -> List[IncidentRecord]:
        stmt = select(IncidentRecord).order_by(desc(IncidentRecord.triggered_at))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Maintenance Windows ---
    async def create_maintenance_window(self, tenant_id: str, title: str, start_time: datetime, end_time: datetime) -> MaintenanceWindow:
        mw = MaintenanceWindow(
            organization_id=tenant_id,
            title=title,
            start_time=start_time,
            end_time=end_time
        )
        self.session.add(mw)
        await self.session.flush()
        return mw

    # --- Deployment Approvals ---
    async def add_deployment_approval(self, deployment_id: uuid.UUID, approver: str, comments: Optional[str] = None) -> DeploymentApproval:
        approval = DeploymentApproval(
            deployment_id=deployment_id,
            approver_name=approver,
            comments=comments
        )
        self.session.add(approval)
        await self.session.flush()
        return approval

    async def get_deployment_approvals(self, deployment_id: uuid.UUID) -> List[DeploymentApproval]:
        stmt = select(DeploymentApproval).where(DeploymentApproval.deployment_id == deployment_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Backups ---
    async def record_backup(self, tenant_id: str, backup_type: str, file_path: str, size: int) -> BackupRecord:
        record = BackupRecord(
            organization_id=tenant_id,
            backup_type=backup_type,
            file_path=file_path,
            file_size_bytes=size
        )
        self.session.add(record)
        await self.session.flush()
        return record

    async def list_backups(self) -> List[BackupRecord]:
        stmt = select(BackupRecord).order_by(desc(BackupRecord.completed_at))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Recovery Executions ---
    async def record_recovery_execution(self, tenant_id: str, recovery_plan_id: uuid.UUID, status: str, details: dict) -> DeploymentRecoveryExecution:
        record = DeploymentRecoveryExecution(
            organization_id=tenant_id,
            recovery_plan_id=recovery_plan_id,
            status=status,
            details=details
        )
        self.session.add(record)
        await self.session.flush()
        return record

    # --- Status Reports ---
    async def record_status_report(self, tenant_id: str, status: str, details: dict) -> StatusReport:
        rep = StatusReport(
            organization_id=tenant_id,
            overall_status=status,
            details=details
        )
        self.session.add(rep)
        await self.session.flush()
        return rep

    async def list_status_reports(self) -> List[StatusReport]:
        stmt = select(StatusReport).order_by(desc(StatusReport.reported_at))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Operational Metrics ---
    async def record_operational_metric(self, tenant_id: str, name: str, value: float, unit: str) -> OperationalMetric:
        metric = OperationalMetric(
            organization_id=tenant_id,
            metric_name=name,
            value=value,
            unit=unit
        )
        self.session.add(metric)
        await self.session.flush()
        return metric

    async def list_operational_metrics(self) -> List[OperationalMetric]:
        stmt = select(OperationalMetric).order_by(desc(OperationalMetric.recorded_at))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Runbooks ---
    async def record_runbook_execution(self, tenant_id: str, runbook_name: str, status: str, logs: str) -> RunbookExecution:
        exe = RunbookExecution(
            organization_id=tenant_id,
            runbook_name=runbook_name,
            status=status,
            logs=logs
        )
        self.session.add(exe)
        await self.session.flush()
        return exe

    async def list_runbook_executions(self) -> List[RunbookExecution]:
        stmt = select(RunbookExecution).order_by(desc(RunbookExecution.executed_at))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Release Evidences ---
    async def record_release_evidence(self, tenant_id: str, release_id: uuid.UUID, type: str, file_path: str, content_hash: str) -> ReleaseEvidence:
        ev = ReleaseEvidence(
            organization_id=tenant_id,
            release_id=release_id,
            evidence_type=type,
            file_path=file_path,
            content_hash=content_hash
        )
        self.session.add(ev)
        await self.session.flush()
        return ev
