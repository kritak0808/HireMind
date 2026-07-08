import uuid
from datetime import datetime
from typing import List, Optional

from models import (
    CacheStatistic,
    CapacityPlan,
    CircuitBreakerState,
    CostReport,
    InfrastructureMetric,
    LoadTestResult,
    OptimizationRecommendation,
    PerformanceBenchmark,
    PerformanceIncident,
    QueueMetric,
    RecoveryExecution,
    RecoveryPlan,
    RetryHistory,
    ScalingPolicy,
    ServiceHealth,
)
from sqlalchemy import and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select


class SQLAlchemyPerformanceRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    # --- Benchmarks ---
    async def create_benchmark(self, tenant_id: str, name: str, component: str, metrics: dict) -> PerformanceBenchmark:
        bench = PerformanceBenchmark(
            organization_id=tenant_id,
            benchmark_name=name,
            target_component=component,
            metrics=metrics
        )
        self.session.add(bench)
        await self.session.flush()
        return bench

    async def list_benchmarks(self) -> List[PerformanceBenchmark]:
        stmt = select(PerformanceBenchmark).order_by(desc(PerformanceBenchmark.executed_at))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Load Tests ---
    async def create_load_test_result(self, tenant_id: str, name: str, concurrency: int, rps: float, avg_latency: float, p95_latency: float, error_rate: float, status: str) -> LoadTestResult:
        result = LoadTestResult(
            organization_id=tenant_id,
            test_name=name,
            concurrency=concurrency,
            requests_per_second=rps,
            avg_latency_ms=avg_latency,
            p95_latency_ms=p95_latency,
            error_rate=error_rate,
            status=status
        )
        self.session.add(result)
        await self.session.flush()
        return result

    async def list_load_tests(self) -> List[LoadTestResult]:
        stmt = select(LoadTestResult).order_by(desc(LoadTestResult.created_at))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Capacity Plans ---
    async def create_capacity_plan(self, tenant_id: str, name: str, resource_type: str, utilization: float, allocation: float) -> CapacityPlan:
        plan = CapacityPlan(
            organization_id=tenant_id,
            plan_name=name,
            resource_type=resource_type,
            forecasted_utilization=utilization,
            recommended_allocation=allocation
        )
        self.session.add(plan)
        await self.session.flush()
        return plan

    async def list_capacity_plans(self) -> List[CapacityPlan]:
        stmt = select(CapacityPlan).order_by(desc(CapacityPlan.created_at))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Scaling Policies ---
    async def get_active_scaling_policies(self, tenant_id: str) -> List[ScalingPolicy]:
        stmt = select(ScalingPolicy).where(and_(ScalingPolicy.organization_id == tenant_id, ScalingPolicy.is_enabled))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create_scaling_policy(self, tenant_id: str, name: str, metric_name: str, scale_up: float, scale_down: float) -> ScalingPolicy:
        policy = ScalingPolicy(
            organization_id=tenant_id,
            policy_name=name,
            metric_name=metric_name,
            scale_up_threshold=scale_up,
            scale_down_threshold=scale_down
        )
        self.session.add(policy)
        await self.session.flush()
        return policy

    # --- Cache Statistics ---
    async def record_cache_statistic(self, tenant_id: str, region: str, hits: int, misses: int, evictions: int = 0, bytes_used: int = 0) -> CacheStatistic:
        stats = CacheStatistic(
            organization_id=tenant_id,
            cache_region=region,
            hits=hits,
            misses=misses,
            evictions=evictions,
            bytes_used=bytes_used
        )
        self.session.add(stats)
        await self.session.flush()
        return stats

    async def list_cache_statistics(self) -> List[CacheStatistic]:
        stmt = select(CacheStatistic).order_by(desc(CacheStatistic.recorded_at))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Infrastructure Metrics ---
    async def record_infrastructure_metric(self, node_id: str, cpu: float, memory: float, disk: float, rx: int, tx: int) -> InfrastructureMetric:
        metric = InfrastructureMetric(
            node_id=node_id,
            cpu_utilization=cpu,
            memory_utilization=memory,
            disk_utilization=disk,
            network_rx_bytes=rx,
            network_tx_bytes=tx
        )
        self.session.add(metric)
        await self.session.flush()
        return metric

    async def get_latest_infra_metrics(self) -> List[InfrastructureMetric]:
        stmt = select(InfrastructureMetric).order_by(desc(InfrastructureMetric.recorded_at)).limit(50)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Disaster Recovery ---
    async def create_recovery_plan(self, tenant_id: str, name: str, rto: int, rpo: int, steps: dict) -> RecoveryPlan:
        plan = RecoveryPlan(
            organization_id=tenant_id,
            plan_name=name,
            rto_seconds=rto,
            rpo_seconds=rpo,
            steps=steps
        )
        self.session.add(plan)
        await self.session.flush()
        return plan

    async def list_recovery_plans(self) -> List[RecoveryPlan]:
        stmt = select(RecoveryPlan).order_by(desc(RecoveryPlan.created_at))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def start_recovery_execution(self, tenant_id: str, plan_id: uuid.UUID, details: dict) -> RecoveryExecution:
        exec = RecoveryExecution(
            organization_id=tenant_id,
            plan_id=plan_id,
            status="started",
            execution_details=details
        )
        self.session.add(exec)
        await self.session.flush()
        return exec

    async def complete_recovery_execution(self, execution_id: uuid.UUID, status: str, details: dict) -> Optional[RecoveryExecution]:
        stmt = select(RecoveryExecution).where(RecoveryExecution.id == execution_id)
        result = await self.session.execute(stmt)
        exec = result.scalar_one_or_none()
        if exec:
            exec.status = status
            exec.execution_details = details
            exec.completed_at = datetime.utcnow()
            await self.session.flush()
        return exec

    async def list_recovery_executions(self) -> List[RecoveryExecution]:
        stmt = select(RecoveryExecution).order_by(desc(RecoveryExecution.started_at))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Service Health ---
    async def update_service_health(self, service_name: str, status: str, latency: float, availability: float) -> ServiceHealth:
        health = ServiceHealth(
            service_name=service_name,
            status=status,
            latency_p95_ms=latency,
            availability=availability
        )
        self.session.add(health)
        await self.session.flush()
        return health

    async def get_services_health(self) -> List[ServiceHealth]:
        stmt = select(ServiceHealth).order_by(desc(ServiceHealth.recorded_at)).limit(20)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Circuit Breakers ---
    async def update_circuit_breaker_state(self, service_name: str, state: str, failure_count: int, reason: Optional[str] = None) -> CircuitBreakerState:
        stmt = select(CircuitBreakerState).where(CircuitBreakerState.service_name == service_name)
        result = await self.session.execute(stmt)
        cb = result.scalar_one_or_none()
        if not cb:
            cb = CircuitBreakerState(service_name=service_name)
            self.session.add(cb)
        cb.state = state
        cb.failure_count = failure_count
        cb.last_failure_reason = reason
        cb.last_state_change = datetime.utcnow()
        await self.session.flush()
        return cb

    async def get_circuit_breaker_states(self) -> List[CircuitBreakerState]:
        stmt = select(CircuitBreakerState).order_by(CircuitBreakerState.service_name)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Retry History ---
    async def record_retry_event(self, tenant_id: str, operation_name: str, retry_count: int, success: bool, error_message: Optional[str] = None) -> RetryHistory:
        retry = RetryHistory(
            organization_id=tenant_id,
            operation_name=operation_name,
            retry_count=retry_count,
            success=success,
            error_message=error_message
        )
        self.session.add(retry)
        await self.session.flush()
        return retry

    # --- Cost Reports ---
    async def create_cost_report(self, tenant_id: str, name: str, total_spend: float, forecast_spend: float, breakdown: dict) -> CostReport:
        report = CostReport(
            organization_id=tenant_id,
            report_name=name,
            total_spend=total_spend,
            forecast_spend=forecast_spend,
            breakdown=breakdown
        )
        self.session.add(report)
        await self.session.flush()
        return report

    async def list_cost_reports(self) -> List[CostReport]:
        stmt = select(CostReport).order_by(desc(CostReport.created_at))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Optimizations ---
    async def create_optimization_recommendation(self, tenant_id: str, component: str, rec_type: str, details: str, impact: str) -> OptimizationRecommendation:
        rec = OptimizationRecommendation(
            organization_id=tenant_id,
            target_component=component,
            recommendation_type=rec_type,
            details=details,
            estimated_impact=impact
        )
        self.session.add(rec)
        await self.session.flush()
        return rec

    async def list_optimization_recommendations(self) -> List[OptimizationRecommendation]:
        stmt = select(OptimizationRecommendation).order_by(desc(OptimizationRecommendation.created_at))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Queue Metrics ---
    async def record_queue_metric(self, queue_name: str, depth: int, rate: float, failed: int) -> QueueMetric:
        qm = QueueMetric(
            queue_name=queue_name,
            queue_depth=depth,
            processing_rate=rate,
            failed_messages_count=failed
        )
        self.session.add(qm)
        await self.session.flush()
        return qm

    async def get_latest_queue_metrics(self) -> List[QueueMetric]:
        stmt = select(QueueMetric).order_by(desc(QueueMetric.recorded_at)).limit(20)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Performance Incidents ---
    async def create_performance_incident(self, tenant_id: str, title: str, severity: str, description: str) -> PerformanceIncident:
        inc = PerformanceIncident(
            organization_id=tenant_id,
            title=title,
            severity=severity,
            description=description,
            status="open"
        )
        self.session.add(inc)
        await self.session.flush()
        return inc

    async def resolve_performance_incident(self, incident_id: uuid.UUID) -> Optional[PerformanceIncident]:
        stmt = select(PerformanceIncident).where(PerformanceIncident.id == incident_id)
        result = await self.session.execute(stmt)
        inc = result.scalar_one_or_none()
        if inc:
            inc.status = "resolved"
            inc.resolved_at = datetime.utcnow()
            await self.session.flush()
        return inc

    async def list_performance_incidents(self) -> List[PerformanceIncident]:
        stmt = select(PerformanceIncident).order_by(desc(PerformanceIncident.created_at))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
