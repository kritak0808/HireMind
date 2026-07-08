import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base_model import Base, TenantModelMixin


class PerformanceBenchmark(Base, TenantModelMixin):
    __tablename__ = "perf_benchmarks"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    benchmark_name: Mapped[str] = mapped_column(String(100), nullable=False)
    target_component: Mapped[str] = mapped_column(String(100), nullable=False)
    metrics: Mapped[dict] = mapped_column(JSON, default=dict) # e.g. {"p50_latency_ms": 12, "memory_kb": 450}
    executed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class LoadTestResult(Base, TenantModelMixin):
    __tablename__ = "perf_load_test_results"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    test_name: Mapped[str] = mapped_column(String(100), nullable=False)
    concurrency: Mapped[int] = mapped_column(Integer, nullable=False)
    requests_per_second: Mapped[float] = mapped_column(Float, nullable=False)
    avg_latency_ms: Mapped[float] = mapped_column(Float, nullable=False)
    p95_latency_ms: Mapped[float] = mapped_column(Float, nullable=False)
    error_rate: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False) # 'passed', 'failed'
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class CapacityPlan(Base, TenantModelMixin):
    __tablename__ = "perf_capacity_plans"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    plan_name: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False) # 'cpu', 'memory', 'db_connections', 'storage'
    forecasted_utilization: Mapped[float] = mapped_column(Float, nullable=False)
    recommended_allocation: Mapped[float] = mapped_column(Float, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class ScalingPolicy(Base, TenantModelMixin):
    __tablename__ = "perf_scaling_policies"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    policy_name: Mapped[str] = mapped_column(String(100), nullable=False)
    metric_name: Mapped[str] = mapped_column(String(100), nullable=False) # 'cpu_utilization', 'request_count'
    scale_up_threshold: Mapped[float] = mapped_column(Float, nullable=False)
    scale_down_threshold: Mapped[float] = mapped_column(Float, nullable=False)
    cooldown_seconds: Mapped[int] = mapped_column(Integer, default=300)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class CacheStatistic(Base, TenantModelMixin):
    __tablename__ = "perf_cache_statistics"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    cache_region: Mapped[str] = mapped_column(String(50), nullable=False) # 'prompts', 'embeddings', 'users'
    hits: Mapped[int] = mapped_column(Integer, default=0)
    misses: Mapped[int] = mapped_column(Integer, default=0)
    evictions: Mapped[int] = mapped_column(Integer, default=0)
    bytes_used: Mapped[int] = mapped_column(Integer, default=0)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class InfrastructureMetric(Base):
    __tablename__ = "perf_infrastructure_metrics"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    node_id: Mapped[str] = mapped_column(String(100), nullable=False)
    cpu_utilization: Mapped[float] = mapped_column(Float, nullable=False)
    memory_utilization: Mapped[float] = mapped_column(Float, nullable=False)
    disk_utilization: Mapped[float] = mapped_column(Float, nullable=False)
    network_rx_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    network_tx_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class RecoveryPlan(Base, TenantModelMixin):
    __tablename__ = "perf_recovery_plans"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    plan_name: Mapped[str] = mapped_column(String(100), nullable=False)
    rto_seconds: Mapped[int] = mapped_column(Integer, nullable=False) # Recovery Time Objective
    rpo_seconds: Mapped[int] = mapped_column(Integer, nullable=False) # Recovery Point Objective
    steps: Mapped[dict] = mapped_column(JSON, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    executions: Mapped[List["RecoveryExecution"]] = relationship("RecoveryExecution", back_populates="plan", cascade="all, delete-orphan")

class RecoveryExecution(Base, TenantModelMixin):
    __tablename__ = "perf_recovery_executions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    plan_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("perf_recovery_plans.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False) # 'started', 'completed', 'failed'
    execution_details: Mapped[dict] = mapped_column(JSON, default=dict)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    plan: Mapped[RecoveryPlan] = relationship("RecoveryPlan", back_populates="executions")

class ServiceHealth(Base):
    __tablename__ = "perf_service_health"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    service_name: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False) # 'healthy', 'degraded', 'unhealthy'
    latency_p95_ms: Mapped[float] = mapped_column(Float, nullable=False)
    availability: Mapped[float] = mapped_column(Float, nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class CircuitBreakerState(Base):
    __tablename__ = "perf_circuit_breaker_states"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    service_name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    state: Mapped[str] = mapped_column(String(30), default="closed") # 'closed', 'open', 'half_open'
    failure_count: Mapped[int] = mapped_column(Integer, default=0)
    last_failure_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    last_state_change: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class RetryHistory(Base, TenantModelMixin):
    __tablename__ = "perf_retry_history"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    operation_name: Mapped[str] = mapped_column(String(100), nullable=False)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    success: Mapped[bool] = mapped_column(Boolean, default=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class CostReport(Base, TenantModelMixin):
    __tablename__ = "perf_cost_reports"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    report_name: Mapped[str] = mapped_column(String(100), nullable=False)
    total_spend: Mapped[float] = mapped_column(Float, nullable=False)
    forecast_spend: Mapped[float] = mapped_column(Float, nullable=False)
    breakdown: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class OptimizationRecommendation(Base, TenantModelMixin):
    __tablename__ = "perf_optimization_recommendations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    target_component: Mapped[str] = mapped_column(String(100), nullable=False)
    recommendation_type: Mapped[str] = mapped_column(String(50), nullable=False) # 'caching', 'indexing', 'query'
    details: Mapped[str] = mapped_column(Text, nullable=False)
    estimated_impact: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="active") # 'active', 'implemented', 'ignored'
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class QueueMetric(Base):
    __tablename__ = "perf_queue_metrics"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    queue_name: Mapped[str] = mapped_column(String(100), nullable=False)
    queue_depth: Mapped[int] = mapped_column(Integer, default=0)
    processing_rate: Mapped[float] = mapped_column(Float, default=0.0) # msgs/sec
    failed_messages_count: Mapped[int] = mapped_column(Integer, default=0)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class PerformanceIncident(Base, TenantModelMixin):
    __tablename__ = "perf_performance_incidents"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    severity: Mapped[str] = mapped_column(String(30), nullable=False) # 'warning', 'critical'
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="open") # 'open', 'investigating', 'resolved'
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
