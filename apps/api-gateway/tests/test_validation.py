from unittest.mock import AsyncMock, MagicMock

import pytest
from models import ReleaseCandidate, TestResult, TestSuite, ValidationRun
from repositories import SQLAlchemyValidationRepository
from telemetry import CertificationEngine, EvidenceCollector, QualityGateEngine, ValidationOrchestrator

# Silence Pytest collection warning for model classes starting with 'Test'
TestSuite.__test__ = False
TestResult.__test__ = False

def test_evidence_collector_hash():
    payload = {"build": 42, "unit_coverage": 85.0}
    h1 = EvidenceCollector.calculate_hash(payload)
    h2 = EvidenceCollector.calculate_hash(payload)
    assert h1 == h2
    assert len(h1) == 64 # SHA-256 is 64 hex characters

def test_quality_gate_evaluator():
    metrics = {"unit_coverage": 85.0, "critical_cves": 0.0, "accessibility_violations": 1.0}

    gates = [
        {"gate_name": "coverage", "metric_name": "unit_coverage", "threshold_value": 80.0},
        {"gate_name": "cve_limit", "metric_name": "critical_cves", "threshold_value": 0.0},
        {"gate_name": "a11y_limit", "metric_name": "accessibility_violations", "threshold_value": 0.0}
    ]

    res = QualityGateEngine.evaluate_gates(metrics, gates)
    assert res["passed"] is False
    assert "a11y_limit" in res["failed_gates"]
    assert res["results"]["unit_coverage"]["passed"] is True
    assert res["results"]["accessibility_violations"]["passed"] is False

def test_certification_generator():
    gate_res = {"passed": True, "failed_gates": [], "results": {}}
    cert = CertificationEngine.generate_certificate("v1.5.0", 98.0, gate_res)
    assert cert["version"] == "v1.5.0"
    assert cert["score"] == 98.0
    assert cert["status"] == "passed"
    assert "sha256" in cert

@pytest.mark.asyncio
async def test_validation_orchestrator_pipeline():
    mock_repo = AsyncMock()

    # Mock return values for DB insert models
    mock_run = ValidationRun(run_name="Pipeline Run v1.5.0")
    mock_repo.create_validation_run.return_value = mock_run

    mock_suite = TestSuite(suite_name="Core Unit Suites - v1.5.0")
    mock_repo.create_test_suite.return_value = mock_suite

    metrics = {"unit_coverage": 88.0, "critical_cves": 0.0, "accessibility_violations": 0.0}
    gates = [
        {"gate_name": "coverage", "metric_name": "unit_coverage", "threshold_value": 80.0},
        {"gate_name": "cves", "metric_name": "critical_cves", "threshold_value": 0.0}
    ]

    result = await ValidationOrchestrator.run_pipeline(
        repo=mock_repo,
        tenant_id="tenant-1",
        version="v1.5.0",
        metrics=metrics,
        gates=gates
    )

    assert result["status"] == "passed"
    assert len(result["gates"]["failed_gates"]) == 0
    assert result["certificate"]["version"] == "v1.5.0"

    mock_repo.create_validation_run.assert_called_once()
    mock_repo.create_test_suite.assert_called_once()
    mock_repo.record_evidence.assert_called_once()

@pytest.mark.asyncio
async def test_validation_repository_crud():
    mock_session = AsyncMock()
    mock_session.add = MagicMock()
    repo = SQLAlchemyValidationRepository(mock_session)

    mock_session.flush = AsyncMock()

    # Create Release Candidate
    rc = await repo.create_release_candidate("tenant-12", "v1.5.0", 12, "config-sha")
    assert rc.version_string == "v1.5.0"
    assert rc.build_number == 12
    assert rc.status == "pending"

    # Query release candidates using MagicMock
    mock_result = MagicMock()
    mock_rc = ReleaseCandidate(version_string="v1.5.0", build_number=12)
    mock_result.scalars.return_value.all.return_value = [mock_rc]
    mock_session.execute.return_value = mock_result

    res = await repo.list_release_candidates()
    assert len(res) == 1
    assert res[0].version_string == "v1.5.0"
