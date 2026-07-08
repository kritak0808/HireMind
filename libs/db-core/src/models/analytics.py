import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base_model import Base, TenantModelMixin


class KPIDefinition(Base, TenantModelMixin):
    __tablename__ = "analytics_kpi_definitions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    formula_expression: Mapped[str] = mapped_column(String(255), nullable=False) # raw math query template
    target_value: Mapped[float] = mapped_column(Numeric(10, 2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class DashboardConfig(Base, TenantModelMixin):
    __tablename__ = "analytics_dashboards"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    widgets_layout: Mapped[dict] = mapped_column(JSON, default=dict) # e.g. [{"type": "line", "kpi_id": "..."}]
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class AnalyticsSnapshot(Base, TenantModelMixin):
    __tablename__ = "analytics_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    snapshot_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    kpi_name: Mapped[str] = mapped_column(String(100), nullable=False)
    computed_value: Mapped[float] = mapped_column(Numeric(15, 4), default=0.0000)
    dimensions_payload: Mapped[dict] = mapped_column(JSON, default=dict) # e.g. {"department": "Engineering"}

class ForecastResult(Base, TenantModelMixin):
    __tablename__ = "analytics_forecasts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    target_kpi: Mapped[str] = mapped_column(String(100), nullable=False)
    forecast_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    predicted_value: Mapped[float] = mapped_column(Numeric(15, 4), nullable=False)
    confidence_interval_lower: Mapped[float] = mapped_column(Numeric(15, 4), nullable=False)
    confidence_interval_upper: Mapped[float] = mapped_column(Numeric(15, 4), nullable=False)
    assumptions_summary: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class InsightRecord(Base, TenantModelMixin):
    __tablename__ = "analytics_insights"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    narrative_card: Mapped[str] = mapped_column(Text, nullable=False)
    confidence_score: Mapped[float] = mapped_column(Numeric(5, 2), default=0.0) # confidence percentage 0 to 100
    evidence_payload: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class ScenarioSimulation(Base, TenantModelMixin):
    __tablename__ = "analytics_simulations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    scenario_name: Mapped[str] = mapped_column(String(100), nullable=False)
    input_parameters: Mapped[dict] = mapped_column(JSON, default=dict) # what if weights adjustments
    projected_outputs: Mapped[dict] = mapped_column(JSON, default=dict) # projected KPI movements
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
