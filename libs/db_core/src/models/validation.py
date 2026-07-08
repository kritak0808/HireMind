import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base_model import Base, TenantModelMixin


class ValidationRun(Base, TenantModelMixin):
    __tablename__ = "qa_validation_runs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    run_name: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="started") # 'started', 'passed', 'failed'
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

class TestSuite(Base, TenantModelMixin):
    __tablename__ = "qa_test_suites"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    suite_name: Mapped[str] = mapped_column(String(100), nullable=False)
    test_type: Mapped[str] = mapped_column(String(50), nullable=False) # 'unit', 'integration', 'e2e', 'security', 'chaos'
    description: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    results: Mapped[List["TestResult"]] = relationship("TestResult", back_populates="suite", cascade="all, delete-orphan")

class TestResult(Base):
    __tablename__ = "qa_test_results"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    suite_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("qa_test_suites.id", ondelete="CASCADE"), nullable=False)
    test_name: Mapped[str] = mapped_column(String(150), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False) # 'passed', 'failed', 'skipped'
    runtime_ms: Mapped[float] = mapped_column(Float, default=0.0)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    executed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    suite: Mapped[TestSuite] = relationship("TestSuite", back_populates="results")

class CertificationReport(Base, TenantModelMixin):
    __tablename__ = "qa_certification_reports"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    version_string: Mapped[str] = mapped_column(String(50), nullable=False)
    overall_score: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="passed") # 'passed', 'failed'
    details: Mapped[dict] = mapped_column(JSON, default=dict)
    issued_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class QualityGate(Base, TenantModelMixin):
    __tablename__ = "qa_quality_gates"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    gate_name: Mapped[str] = mapped_column(String(100), nullable=False)
    metric_name: Mapped[str] = mapped_column(String(100), nullable=False) # 'unit_coverage', 'critical_cves'
    threshold_value: Mapped[float] = mapped_column(Float, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class EvidenceRecord(Base, TenantModelMixin):
    __tablename__ = "qa_evidence_records"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    evidence_type: Mapped[str] = mapped_column(String(100), nullable=False) # 'security_scan', 'wcag_audit', 'compliance_audit'
    file_path: Mapped[str] = mapped_column(String(255), nullable=False)
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False) # SHA-256
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class SecurityFinding(Base, TenantModelMixin):
    __tablename__ = "qa_security_findings"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    cve_id: Mapped[str] = mapped_column(String(50), nullable=False)
    severity: Mapped[str] = mapped_column(String(30), nullable=False) # 'low', 'medium', 'high', 'critical'
    target_component: Mapped[str] = mapped_column(String(100), nullable=False)
    details: Mapped[str] = mapped_column(Text, nullable=False)
    is_resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class AccessibilityFinding(Base, TenantModelMixin):
    __tablename__ = "qa_accessibility_findings"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    wcag_criteria: Mapped[str] = mapped_column(String(50), nullable=False) # e.g. 'AA 1.4.3'
    target_component_id: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="open") # 'open', 'resolved'
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class ComplianceFinding(Base, TenantModelMixin):
    __tablename__ = "qa_compliance_findings"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    compliance_framework: Mapped[str] = mapped_column(String(50), nullable=False) # 'gdpr', 'soc2'
    finding_type: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="open") # 'open', 'resolved'
    details: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class ReleaseCandidate(Base, TenantModelMixin):
    __tablename__ = "qa_release_candidates"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    version_string: Mapped[str] = mapped_column(String(50), nullable=False)
    build_number: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="pending") # 'pending', 'passed', 'rejected'
    config_sha: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    approvals: Mapped[List["ReleaseApproval"]] = relationship("ReleaseApproval", back_populates="candidate", cascade="all, delete-orphan")

class ReleaseApproval(Base):
    __tablename__ = "qa_release_approvals"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    candidate_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("qa_release_candidates.id", ondelete="CASCADE"), nullable=False)
    approver_name: Mapped[str] = mapped_column(String(100), nullable=False)
    comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    signature: Mapped[str] = mapped_column(String(128), nullable=False) # Cryptographic signature hash
    approved_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    candidate: Mapped[ReleaseCandidate] = relationship("ReleaseCandidate", back_populates="approvals")

class PenetrationReport(Base, TenantModelMixin):
    __tablename__ = "qa_penetration_reports"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    target_url: Mapped[str] = mapped_column(String(255), nullable=False)
    scan_type: Mapped[str] = mapped_column(String(50), nullable=False) # 'owasp_zap', 'nessus'
    vulnerabilities_count: Mapped[int] = mapped_column(Integer, default=0)
    raw_log: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class CoverageReport(Base, TenantModelMixin):
    __tablename__ = "qa_coverage_reports"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    target_component: Mapped[str] = mapped_column(String(100), nullable=False)
    line_coverage: Mapped[float] = mapped_column(Float, nullable=False)
    branch_coverage: Mapped[float] = mapped_column(Float, nullable=False)
    statements_count: Mapped[int] = mapped_column(Integer, nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class RegressionReport(Base, TenantModelMixin):
    __tablename__ = "qa_regression_reports"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    metric_name: Mapped[str] = mapped_column(String(100), nullable=False)
    baseline_value: Mapped[float] = mapped_column(Float, nullable=False)
    current_value: Mapped[float] = mapped_column(Float, nullable=False)
    drift_percent: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="passed") # 'passed', 'drifted'
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class ValidationMetric(Base, TenantModelMixin):
    __tablename__ = "qa_validation_metrics"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    metric_name: Mapped[str] = mapped_column(String(100), nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(20), nullable=False) # '%', 'count', 'ms'
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
