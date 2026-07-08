import uuid
from datetime import datetime
from typing import List, Optional

from models import (
    AccessibilityFinding,
    CertificationReport,
    ComplianceFinding,
    CoverageReport,
    EvidenceRecord,
    PenetrationReport,
    QualityGate,
    RegressionReport,
    ReleaseApproval,
    ReleaseCandidate,
    SecurityFinding,
    TestResult,
    TestSuite,
    ValidationMetric,
    ValidationRun,
)
from sqlalchemy import and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select


class SQLAlchemyValidationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    # --- Validation Runs ---
    async def create_validation_run(self, tenant_id: str, name: str) -> ValidationRun:
        run = ValidationRun(
            organization_id=tenant_id,
            run_name=name,
            status="started"
        )
        self.session.add(run)
        await self.session.flush()
        return run

    async def complete_validation_run(self, run_id: uuid.UUID, status: str) -> Optional[ValidationRun]:
        stmt = select(ValidationRun).where(ValidationRun.id == run_id)
        result = await self.session.execute(stmt)
        run = result.scalar_one_or_none()
        if run:
            run.status = status
            run.completed_at = datetime.utcnow()
            await self.session.flush()
        return run

    async def list_validation_runs(self) -> List[ValidationRun]:
        stmt = select(ValidationRun).order_by(desc(ValidationRun.started_at))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Test Suites & Results ---
    async def create_test_suite(self, tenant_id: str, name: str, test_type: str, description: str) -> TestSuite:
        suite = TestSuite(
            organization_id=tenant_id,
            suite_name=name,
            test_type=test_type,
            description=description
        )
        self.session.add(suite)
        await self.session.flush()
        return suite

    async def record_test_result(self, suite_id: uuid.UUID, name: str, status: str, runtime_ms: float, error: Optional[str] = None) -> TestResult:
        res = TestResult(
            suite_id=suite_id,
            test_name=name,
            status=status,
            runtime_ms=runtime_ms,
            error_message=error
        )
        self.session.add(res)
        await self.session.flush()
        return res

    async def list_test_suites(self) -> List[TestSuite]:
        stmt = select(TestSuite).order_by(TestSuite.suite_name)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Certifications ---
    async def create_certification_report(self, tenant_id: str, version: str, score: float, status: str, details: dict) -> CertificationReport:
        cert = CertificationReport(
            organization_id=tenant_id,
            version_string=version,
            overall_score=score,
            status=status,
            details=details
        )
        self.session.add(cert)
        await self.session.flush()
        return cert

    async def list_certifications(self) -> List[CertificationReport]:
        stmt = select(CertificationReport).order_by(desc(CertificationReport.issued_at))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Quality Gates ---
    async def get_active_quality_gates(self, tenant_id: str) -> List[QualityGate]:
        stmt = select(QualityGate).where(and_(QualityGate.organization_id == tenant_id, QualityGate.is_active))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create_quality_gate(self, tenant_id: str, name: str, metric: str, threshold: float) -> QualityGate:
        gate = QualityGate(
            organization_id=tenant_id,
            gate_name=name,
            metric_name=metric,
            threshold_value=threshold
        )
        self.session.add(gate)
        await self.session.flush()
        return gate

    # --- Evidence Records ---
    async def record_evidence(self, tenant_id: str, type: str, file_path: str, content_hash: str) -> EvidenceRecord:
        record = EvidenceRecord(
            organization_id=tenant_id,
            evidence_type=type,
            file_path=file_path,
            content_hash=content_hash
        )
        self.session.add(record)
        await self.session.flush()
        return record

    async def list_evidence(self) -> List[EvidenceRecord]:
        stmt = select(EvidenceRecord).order_by(desc(EvidenceRecord.created_at))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Security Findings ---
    async def record_security_finding(self, tenant_id: str, cve: str, severity: str, component: str, details: str) -> SecurityFinding:
        finding = SecurityFinding(
            organization_id=tenant_id,
            cve_id=cve,
            severity=severity,
            target_component=component,
            details=details
        )
        self.session.add(finding)
        await self.session.flush()
        return finding

    async def resolve_security_finding(self, finding_id: uuid.UUID) -> Optional[SecurityFinding]:
        stmt = select(SecurityFinding).where(SecurityFinding.id == finding_id)
        result = await self.session.execute(stmt)
        finding = result.scalar_one_or_none()
        if finding:
            finding.is_resolved = True
            await self.session.flush()
        return finding

    async def list_security_findings(self) -> List[SecurityFinding]:
        stmt = select(SecurityFinding).order_by(desc(SecurityFinding.created_at))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Accessibility Findings ---
    async def record_accessibility_finding(self, tenant_id: str, wcag: str, component_id: str, desc_text: str) -> AccessibilityFinding:
        finding = AccessibilityFinding(
            organization_id=tenant_id,
            wcag_criteria=wcag,
            target_component_id=component_id,
            description=desc_text
        )
        self.session.add(finding)
        await self.session.flush()
        return finding

    async def resolve_accessibility_finding(self, finding_id: uuid.UUID) -> Optional[AccessibilityFinding]:
        stmt = select(AccessibilityFinding).where(AccessibilityFinding.id == finding_id)
        result = await self.session.execute(stmt)
        finding = result.scalar_one_or_none()
        if finding:
            finding.status = "resolved"
            await self.session.flush()
        return finding

    async def list_accessibility_findings(self) -> List[AccessibilityFinding]:
        stmt = select(AccessibilityFinding).order_by(desc(AccessibilityFinding.created_at))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Compliance Findings ---
    async def record_compliance_finding(self, tenant_id: str, framework: str, type: str, details: str) -> ComplianceFinding:
        finding = ComplianceFinding(
            organization_id=tenant_id,
            compliance_framework=framework,
            finding_type=type,
            details=details
        )
        self.session.add(finding)
        await self.session.flush()
        return finding

    async def list_compliance_findings(self) -> List[ComplianceFinding]:
        stmt = select(ComplianceFinding).order_by(desc(ComplianceFinding.created_at))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Release Candidates & Approvals ---
    async def create_release_candidate(self, tenant_id: str, version: str, build_num: int, config_sha: str) -> ReleaseCandidate:
        rc = ReleaseCandidate(
            organization_id=tenant_id,
            version_string=version,
            build_number=build_num,
            config_sha=config_sha,
            status="pending"
        )
        self.session.add(rc)
        await self.session.flush()
        return rc

    async def update_candidate_status(self, candidate_id: uuid.UUID, status: str) -> Optional[ReleaseCandidate]:
        stmt = select(ReleaseCandidate).where(ReleaseCandidate.id == candidate_id)
        result = await self.session.execute(stmt)
        rc = result.scalar_one_or_none()
        if rc:
            rc.status = status
            await self.session.flush()
        return rc

    async def list_release_candidates(self) -> List[ReleaseCandidate]:
        stmt = select(ReleaseCandidate).order_by(desc(ReleaseCandidate.created_at))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def add_release_approval(self, candidate_id: uuid.UUID, approver: str, signature: str, comments: Optional[str] = None) -> ReleaseApproval:
        approval = ReleaseApproval(
            candidate_id=candidate_id,
            approver_name=approver,
            signature=signature,
            comments=comments
        )
        self.session.add(approval)
        await self.session.flush()
        return approval

    async def get_candidate_approvals(self, candidate_id: uuid.UUID) -> List[ReleaseApproval]:
        stmt = select(ReleaseApproval).where(ReleaseApproval.candidate_id == candidate_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Penetration Reports ---
    async def create_penetration_report(self, tenant_id: str, url: str, scan_type: str, count: int, raw_log: str) -> PenetrationReport:
        rep = PenetrationReport(
            organization_id=tenant_id,
            target_url=url,
            scan_type=scan_type,
            vulnerabilities_count=count,
            raw_log=raw_log
        )
        self.session.add(rep)
        await self.session.flush()
        return rep

    async def list_penetration_reports(self) -> List[PenetrationReport]:
        stmt = select(PenetrationReport).order_by(desc(PenetrationReport.created_at))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Coverage Reports ---
    async def record_coverage_report(self, tenant_id: str, component: str, line: float, branch: float, statements: int) -> CoverageReport:
        rep = CoverageReport(
            organization_id=tenant_id,
            target_component=component,
            line_coverage=line,
            branch_coverage=branch,
            statements_count=statements
        )
        self.session.add(rep)
        await self.session.flush()
        return rep

    async def list_coverage_reports(self) -> List[CoverageReport]:
        stmt = select(CoverageReport).order_by(desc(CoverageReport.recorded_at))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Regression Reports ---
    async def record_regression_report(self, tenant_id: str, metric: str, baseline: float, current: float, drift: float, status: str) -> RegressionReport:
        rep = RegressionReport(
            organization_id=tenant_id,
            metric_name=metric,
            baseline_value=baseline,
            current_value=current,
            drift_percent=drift,
            status=status
        )
        self.session.add(rep)
        await self.session.flush()
        return rep

    async def list_regression_reports(self) -> List[RegressionReport]:
        stmt = select(RegressionReport).order_by(desc(RegressionReport.recorded_at))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Validation Metrics ---
    async def record_validation_metric(self, tenant_id: str, name: str, value: float, unit: str) -> ValidationMetric:
        metric = ValidationMetric(
            organization_id=tenant_id,
            metric_name=name,
            value=value,
            unit=unit
        )
        self.session.add(metric)
        await self.session.flush()
        return metric

    async def list_validation_metrics(self) -> List[ValidationMetric]:
        stmt = select(ValidationMetric).order_by(desc(ValidationMetric.recorded_at))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
