import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest
from models import DeploymentRecord, IncidentRecord, ReleaseRecord, RollbackHistory, RunbookExecution
from repositories import SQLAlchemyDeploymentRepository
from telemetry import IncidentManagementPlatform, ProductionDeploymentManager, ReleaseOrchestrator, RunbookEngine


@pytest.mark.asyncio
async def test_canary_deployment_promotions():
    mock_repo = AsyncMock()
    dep_id = uuid.uuid4()

    # 1. Promote to 25% traffic
    res = await ProductionDeploymentManager.promote_canary(mock_repo, dep_id, 25)
    assert res["status"] == "in_progress"
    assert res["stage_percentage"] == 25
    assert res["smoke_test"] == "passed"

@pytest.mark.asyncio
async def test_deployment_rollback_trigger():
    mock_repo = AsyncMock()
    dep_id = uuid.uuid4()

    mock_rb = RollbackHistory(reason="high error rates")
    mock_repo.record_rollback.return_value = mock_rb
    mock_repo.update_rollback_status.return_value = mock_rb
    mock_repo.complete_deployment_record.return_value = None

    # Trigger forced rollback
    res = await ProductionDeploymentManager.execute_rollback(mock_repo, dep_id, "high error rates")
    assert res["status"] == "success"
    assert res["reason"] == "high error rates"

    mock_repo.record_rollback.assert_called_once()
    mock_repo.update_rollback_status.assert_called_once()
    mock_repo.complete_deployment_record.assert_called_once()

@pytest.mark.asyncio
async def test_release_orchestrator_publish():
    mock_repo = AsyncMock()

    mock_rel = ReleaseRecord(version_string="v1.0.0", git_tag="v1.0.0-release")
    mock_repo.create_release_record.return_value = mock_rel
    mock_repo.create_release_note.return_value = None
    mock_repo.record_release_evidence.return_value = None

    res = await ReleaseOrchestrator.publish_release(
        repo=mock_repo,
        tenant_id="tenant-12",
        version="v1.0.0",
        git_tag="v1.0.0-release",
        build_number=12,
        released_by="DevOps Eng",
        changelog="Initial release changes list."
    )

    assert res["version"] == "v1.0.0"
    assert res["git_tag"] == "v1.0.0-release"
    assert res["status"] == "published"

    mock_repo.create_release_record.assert_called_once()
    mock_repo.create_release_note.assert_called_once()

@pytest.mark.asyncio
async def test_incident_management_escalation():
    mock_repo = AsyncMock()

    mock_inc = IncidentRecord(title="DB Saturated", severity="critical")
    mock_repo.record_incident.return_value = mock_inc

    # Trigger critical severity incident
    res = await IncidentManagementPlatform.trigger_incident(
        repo=mock_repo,
        tenant_id="tenant-12",
        title="DB Saturated",
        description="Connection pool limit exceeded",
        severity="critical"
    )
    assert res["status"] == "open"
    assert res["escalated_to"] == "L3-SecOps-Team"

@pytest.mark.asyncio
async def test_runbook_playbook_executions():
    mock_repo = AsyncMock()

    mock_exe = RunbookExecution(runbook_name="flush_redis_cache", status="success")
    mock_repo.record_runbook_execution.return_value = mock_exe

    # Execute cache flush playbook
    res = await RunbookEngine.execute_runbook(mock_repo, "tenant-1", "flush_redis_cache")
    assert res["status"] == "success"
    assert "Memory cleared" in res["logs"]

    # Execute invalid playbook
    res_fail = await RunbookEngine.execute_runbook(mock_repo, "tenant-1", "invalid_playbook")
    assert res_fail["status"] == "failed"
    assert "Unknown runbook" in res_fail["logs"]

@pytest.mark.asyncio
async def test_deployment_repository_crud():
    mock_session = AsyncMock()
    mock_session.add = MagicMock()
    repo = SQLAlchemyDeploymentRepository(mock_session)
    mock_session.flush = AsyncMock()

    # Create Deployment
    dep = await repo.create_deployment_record("tenant-1", "v1.0.0", "production")
    assert dep.version_string == "v1.0.0"
    assert dep.environment == "production"
    assert dep.status == "started"

    # Query deployments using MagicMock
    mock_result = MagicMock()
    mock_dep = DeploymentRecord(version_string="v1.0.0", environment="production")
    mock_result.scalars.return_value.all.return_value = [mock_dep]
    mock_session.execute.return_value = mock_result

    res = await repo.list_deployments()
    assert len(res) == 1
    assert res[0].version_string == "v1.0.0"
