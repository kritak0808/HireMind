import asyncio
from unittest.mock import AsyncMock, MagicMock

import pytest
from models import ServiceHealth
from repositories import SQLAlchemyPerformanceRepository
from telemetry import BulkheadManager, CircuitBreaker, CircuitOpenException, RedisCachingPlatform, RetryOrchestrator


# 1. Test Redis Caching Platform Fail-Silent Fallback and In-Memory Analytics
@pytest.mark.asyncio
async def test_caching_platform_hit_miss_calculations():
    # If Redis client is missing, cache returns misses but fails silent
    RedisCachingPlatform.reset_metrics()

    val = await RedisCachingPlatform.get("nonexistent-key-1")
    assert val is None

    metrics = RedisCachingPlatform.get_metrics()
    assert metrics["hits"] == 0
    assert metrics["misses"] == 1
    assert metrics["hit_rate"] == 0.0

@pytest.mark.asyncio
async def test_caching_read_through_flow():
    RedisCachingPlatform.reset_metrics()

    # Mock data loader function
    loaded_data = {"profile": "standard-candidate"}
    async def data_loader():
        return loaded_data

    # Read-through fetches data using loader since cache is empty (misses increment)
    res = await RedisCachingPlatform.read_through("candidate-1", data_loader, ttl_seconds=60)
    assert res == loaded_data

    metrics = RedisCachingPlatform.get_metrics()
    assert metrics["misses"] == 1 # 1 from read-through get check

# 2. Test Resilience Circuit Breakers
@pytest.mark.asyncio
async def test_circuit_breaker_transitions():
    # Simulate a downstream worker call
    calls_count = 0
    async def external_provider_call():
        nonlocal calls_count
        calls_count += 1
        if calls_count <= 3:
            raise Exception("Provider Timeout 504")
        return {"data": "LLM output response"}

    # Callback mapping to check status updates
    cb_states = []
    async def cb_callback(svc: str, state: str, fails: int, err: str):
        cb_states.append(state)

    breaker = CircuitBreaker(
        service_name="gemini-provider",
        failure_threshold=3,
        recovery_timeout_seconds=1,
        state_change_callback=cb_callback
    )

    # 1. First execution failure
    with pytest.raises(Exception):
        await breaker.execute(external_provider_call)
    assert breaker.state == "closed"
    assert breaker.failure_count == 1

    # 2. Second execution failure
    with pytest.raises(Exception):
        await breaker.execute(external_provider_call)
    assert breaker.state == "closed"
    assert breaker.failure_count == 2

    # 3. Third execution failure (rips open)
    with pytest.raises(Exception):
        await breaker.execute(external_provider_call)
    assert breaker.state == "open"
    assert breaker.failure_count == 3
    assert "open" in cb_states

    # 4. Immediate execution fails fast with CircuitOpenException
    with pytest.raises(CircuitOpenException):
        await breaker.execute(external_provider_call)

    # 5. Cooldown period wait
    await asyncio.sleep(1.1)

    # 6. Next call succeeds and resets circuit back to CLOSED
    res = await breaker.execute(external_provider_call)
    assert res["data"] == "LLM output response"
    assert breaker.state == "closed"
    assert breaker.failure_count == 0
    assert "closed" in cb_states

# 3. Test Resilience Retry backoff & Bulkheads
@pytest.mark.asyncio
async def test_retry_orchestrator_max_attempts():
    retries_recorded = 0
    async def failing_operation():
        nonlocal retries_recorded
        retries_recorded += 1
        raise ValueError("Simulated network outage error")

    # Retry count should execute 1 initial call + 2 retries = 3 attempts total
    with pytest.raises(ValueError):
        await RetryOrchestrator.execute(
            func=failing_operation,
            max_retries=2,
            base_delay_seconds=0.01,
            jitter=False
        )
    assert retries_recorded == 3

@pytest.mark.asyncio
async def test_bulkhead_concurrency_semaphore():
    concurrent_calls = 0
    async def concurrent_task():
        nonlocal concurrent_calls
        concurrent_calls += 1
        await asyncio.sleep(0.05)
        concurrent_calls -= 1
        return True

    # Run multiple tasks concurrent through bulkhead limit of 2
    tasks = [
        BulkheadManager.execute("openai-endpoint", 2, concurrent_task)
        for _ in range(5)
    ]
    results = await asyncio.gather(*tasks)
    assert len(results) == 5
    assert all(results)

# 4. Test Performance Database Repository Mocks
@pytest.mark.asyncio
async def test_performance_repository_crud():
    mock_session = AsyncMock()
    mock_session.add = MagicMock()
    repo = SQLAlchemyPerformanceRepository(mock_session)

    # 1. Test create benchmark
    mock_session.flush = AsyncMock()
    bench = await repo.create_benchmark(
        tenant_id="tenant-123",
        name="resume-parse-load",
        component="workers",
        metrics={"p95_ms": 310}
    )
    assert bench.benchmark_name == "resume-parse-load"
    assert bench.target_component == "workers"
    assert bench.metrics == {"p95_ms": 310}

    # 2. Test query service health records using MagicMock
    mock_result = MagicMock()
    mock_health = ServiceHealth(service_name="apigateway", status="healthy", latency_p95_ms=120.0, availability=1.0)
    mock_result.scalars.return_value.all.return_value = [mock_health]
    mock_session.execute.return_value = mock_result

    res = await repo.get_services_health()
    assert len(res) == 1
    assert res[0].service_name == "apigateway"
    assert res[0].status == "healthy"
