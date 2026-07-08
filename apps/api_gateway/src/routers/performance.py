import logging
import random
import time
import uuid
from typing import Any, Dict, List, Optional

import path_setup  # noqa: F401
from auth import get_current_user_session
from db import get_db_session
from events import BaseEvent, RedisEventBus
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from repositories.performance import SQLAlchemyPerformanceRepository
from security import UserSession
from sqlalchemy.ext.asyncio import AsyncSession
from telemetry import BulkheadManager, CircuitBreaker, CircuitOpenException, RedisCachingPlatform, RetryOrchestrator

logger = logging.getLogger("hiremind.api.performance")
router = APIRouter(prefix="/performance", tags=["Performance Engineering & Hardening"])

# --- Request/Response Schemas ---
class BenchmarkCreateSchema(BaseModel):
    benchmark_name: str
    target_component: str
    metrics: Dict[str, Any]

class LoadTestCreateSchema(BaseModel):
    test_name: str
    concurrency: int
    requests_per_second: float
    avg_latency_ms: float
    p95_latency_ms: float
    error_rate: float
    status: str

class CapacityPlanCreateSchema(BaseModel):
    plan_name: str
    resource_type: str
    forecasted_utilization: float
    recommended_allocation: float

class RecoveryPlanCreateSchema(BaseModel):
    plan_name: str
    rto_seconds: int
    rpo_seconds: int
    steps: Dict[str, Any]

class RecoveryExecutionCreateSchema(BaseModel):
    plan_id: uuid.UUID
    details: Dict[str, Any]

class IncidentCreateSchema(BaseModel):
    title: str
    severity: str
    description: str

class CacheWarmSchema(BaseModel):
    region: str
    keys: List[str]

class CacheClearSchema(BaseModel):
    pattern: str

class RoutingSimulationSchema(BaseModel):
    service_name: str
    fail_rate: float = 0.5
    concurrency_limit: int = 5

# --- Router Endpoints ---

@router.get("/metrics")
async def get_performance_metrics(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyPerformanceRepository(db)
    infra = await repo.get_latest_infra_metrics()
    queues = await repo.get_latest_queue_metrics()
    caches = await repo.list_cache_statistics()

    # Inject active dynamic stats
    return {
        "infrastructure_metrics": [
            {
                "id": str(i.id),
                "node_id": i.node_id,
                "cpu_utilization": i.cpu_utilization,
                "memory_utilization": i.memory_utilization,
                "disk_utilization": i.disk_utilization,
                "recorded_at": i.recorded_at.isoformat()
            } for i in infra
        ],
        "queue_metrics": [
            {
                "id": str(q.id),
                "queue_name": q.queue_name,
                "queue_depth": q.queue_depth,
                "processing_rate": q.processing_rate,
                "failed_messages_count": q.failed_messages_count,
                "recorded_at": q.recorded_at.isoformat()
            } for q in queues
        ],
        "cache_metrics": [
            {
                "id": str(c.id),
                "cache_region": c.cache_region,
                "hits": c.hits,
                "misses": c.misses,
                "evictions": c.evictions,
                "recorded_at": c.recorded_at.isoformat()
            } for c in caches
        ]
    }

@router.post("/benchmarks")
async def execute_benchmark(
    payload: BenchmarkCreateSchema,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyPerformanceRepository(db)
    bench = await repo.create_benchmark(
        tenant_id=session.tenant_id,
        name=payload.benchmark_name,
        component=payload.target_component,
        metrics=payload.metrics
    )

    # Dispatch BenchmarkCompleted event
    bus = RedisEventBus()
    event = BaseEvent(
        event_type="BenchmarkCompleted",
        tenant_id=session.tenant_id,
        correlation_id=str(uuid.uuid4()),
        payload={
            "benchmark_id": str(bench.id),
            "benchmark_name": bench.benchmark_name,
            "target_component": bench.target_component,
            "metrics": bench.metrics
        }
    )
    await bus.publish(event)
    return {"status": "success", "benchmark_id": str(bench.id)}

@router.get("/benchmarks")
async def list_benchmarks(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyPerformanceRepository(db)
    data = await repo.list_benchmarks()
    return data

@router.post("/cache/warm")
async def warm_cache(
    payload: CacheWarmSchema,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyPerformanceRepository(db)
    warmed_count = 0
    for k in payload.keys:
        val = {"warmed_at": time.time(), "region": payload.region, "key": k}
        success = await RedisCachingPlatform.set(f"{payload.region}:{k}", val, ttl_seconds=3600)
        if success:
            warmed_count += 1

    await repo.record_cache_statistic(
        tenant_id=session.tenant_id,
        region=payload.region,
        hits=0,
        misses=warmed_count,
        evictions=0,
        bytes_used=warmed_count * 128
    )
    return {"status": "success", "warmed_count": warmed_count}

@router.post("/cache/clear")
async def clear_cache(
    payload: CacheClearSchema,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyPerformanceRepository(db)
    cleared = await RedisCachingPlatform.invalidate_pattern(payload.pattern)

    # Dispatch CacheInvalidated event
    bus = RedisEventBus()
    event = BaseEvent(
        event_type="CacheInvalidated",
        tenant_id=session.tenant_id,
        correlation_id=str(uuid.uuid4()),
        payload={"pattern": payload.pattern, "cleared_count": cleared}
    )
    await bus.publish(event)

    await repo.record_cache_statistic(
        tenant_id=session.tenant_id,
        region="all",
        hits=0,
        misses=0,
        evictions=cleared
    )
    return {"status": "success", "cleared_count": cleared}

@router.get("/cache/metrics")
async def get_cache_in_memory_metrics(
    session: UserSession = Depends(get_current_user_session)
):
    return RedisCachingPlatform.get_metrics()

# --- Disaster Recovery ---

@router.get("/recovery/plans")
async def list_recovery_plans(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyPerformanceRepository(db)
    return await repo.list_recovery_plans()

@router.post("/recovery/plans")
async def create_recovery_plan(
    payload: RecoveryPlanCreateSchema,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyPerformanceRepository(db)
    plan = await repo.create_recovery_plan(
        tenant_id=session.tenant_id,
        name=payload.plan_name,
        rto=payload.rto_seconds,
        rpo=payload.rpo_seconds,
        steps=payload.steps
    )
    return {"status": "success", "plan_id": str(plan.id)}

@router.post("/recovery/executions")
async def run_recovery_execution(
    payload: RecoveryExecutionCreateSchema,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyPerformanceRepository(db)
    exec = await repo.start_recovery_execution(
        tenant_id=session.tenant_id,
        plan_id=payload.plan_id,
        details=payload.details
    )

    # Dispatch RecoveryStarted event
    bus = RedisEventBus()
    event = BaseEvent(
        event_type="RecoveryStarted",
        tenant_id=session.tenant_id,
        correlation_id=str(uuid.uuid4()),
        payload={"execution_id": str(exec.id), "plan_id": str(payload.plan_id)}
    )
    await bus.publish(event)

    # Simulate async recovery progress
    await repo.complete_recovery_execution(
        execution_id=exec.id,
        status="completed",
        details={"steps_completed": True, "data_replicated": True}
    )

    # Dispatch RecoveryCompleted event
    event_comp = BaseEvent(
        event_type="RecoveryCompleted",
        tenant_id=session.tenant_id,
        correlation_id=str(uuid.uuid4()),
        payload={"execution_id": str(exec.id), "status": "completed"}
    )
    await bus.publish(event_comp)

    return {"status": "completed", "execution_id": str(exec.id)}

# --- Incidents ---

@router.get("/incidents")
async def list_performance_incidents(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyPerformanceRepository(db)
    return await repo.list_performance_incidents()

@router.post("/incidents")
async def create_performance_incident(
    payload: IncidentCreateSchema,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyPerformanceRepository(db)
    inc = await repo.create_performance_incident(
        tenant_id=session.tenant_id,
        title=payload.title,
        severity=payload.severity,
        description=payload.description
    )

    # Dispatch PerformanceIncidentCreated event
    bus = RedisEventBus()
    event = BaseEvent(
        event_type="PerformanceIncidentCreated",
        tenant_id=session.tenant_id,
        correlation_id=str(uuid.uuid4()),
        payload={"incident_id": str(inc.id), "severity": inc.severity, "title": inc.title}
    )
    await bus.publish(event)
    return {"status": "success", "incident_id": str(inc.id)}

@router.post("/incidents/{id}/resolve")
async def resolve_performance_incident(
    id: uuid.UUID,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyPerformanceRepository(db)
    inc = await repo.resolve_performance_incident(id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {"status": "resolved", "incident_id": str(inc.id)}

# --- Service Health & CBs ---

@router.get("/services/health")
async def get_services_health(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyPerformanceRepository(db)
    return await repo.get_services_health()

@router.get("/circuit-breakers")
async def list_circuit_breakers(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyPerformanceRepository(db)
    return await repo.get_circuit_breaker_states()

@router.get("/costs")
async def list_cost_reports(
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyPerformanceRepository(db)
    return await repo.list_cost_reports()

# --- Resilience Simulation Router ---

@router.post("/routing/simulation")
async def run_resilience_routing_simulation(
    payload: RoutingSimulationSchema,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Executes a simulated call wrapped in a Bulkhead limit, monitored by a Circuit Breaker,
    and driven by the RetryOrchestrator.
    """
    repo = SQLAlchemyPerformanceRepository(db)
    bus = RedisEventBus()

    # Callback to log state changes of Circuit Breaker to relational database
    async def cb_state_callback(svc: str, state: str, fails: int, err: Optional[str]):
        async with db.begin_nested():
            await repo.update_circuit_breaker_state(svc, state, fails, err)
        # Publish HealthStatusChanged
        evt = BaseEvent(
            event_type="HealthStatusChanged",
            tenant_id=session.tenant_id,
            correlation_id=str(uuid.uuid4()),
            payload={"service_name": svc, "state": state, "failures": fails}
        )
        await bus.publish(evt)

    # Callback to log retry counts to database
    async def retry_callback(op_name: str, count: int, success: bool, err_msg: Optional[str]):
        async with db.begin_nested():
            await repo.record_retry_event(session.tenant_id, op_name, count, success, err_msg)

    # Instantiate CB
    breaker = CircuitBreaker(
        service_name=payload.service_name,
        failure_threshold=3,
        recovery_timeout_seconds=5,
        state_change_callback=cb_state_callback
    )

    # Simulated worker logic
    async def simulated_network_call():
        if random.random() < payload.fail_rate:
            raise Exception("Simulated connection timeout to remote LLM node")
        return {"response": "Completed successfully using fallback LLM configuration"}

    # Wrap the worker in the CB + Retry + Bulkhead
    async def pipeline():
        return await breaker.execute(simulated_network_call)

    start_time = time.time()
    try:
        # Wrap everything in Bulkhead and Retry
        res = await BulkheadManager.execute(
            payload.service_name,
            payload.concurrency_limit,
            RetryOrchestrator.execute,
            func=pipeline,
            max_retries=2,
            base_delay_seconds=0.1,
            retry_callback=retry_callback
        )
        latency = int((time.time() - start_time) * 1000)

        # Log service health metric
        await repo.update_service_health(payload.service_name, "healthy", latency, 1.0)
        return {
            "status": "success",
            "latency_ms": latency,
            "data": res,
            "circuit_breaker_state": breaker.state
        }
    except CircuitOpenException as coe:
        latency = int((time.time() - start_time) * 1000)
        await repo.update_service_health(payload.service_name, "unhealthy", latency, 0.0)
        return {
            "status": "circuit_open_blocked",
            "latency_ms": latency,
            "error": str(coe),
            "circuit_breaker_state": breaker.state
        }
    except Exception as e:
        latency = int((time.time() - start_time) * 1000)
        await repo.update_service_health(payload.service_name, "degraded", latency, 0.0)
        return {
            "status": "failed",
            "latency_ms": latency,
            "error": str(e),
            "circuit_breaker_state": breaker.state
        }
