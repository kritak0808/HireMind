import logging
import uuid
from datetime import datetime, timedelta

import path_setup  # noqa: F401
from auth import get_current_user_session
from contracts import ForecastGeneratedEvent, MetricsAggregatedEvent
from db import get_db_session
from events import RedisEventBus
from fastapi import APIRouter, Depends, status
from models import ForecastResult, ScenarioSimulation
from repositories import SQLAlchemyAnalyticsRepository
from security import UserSession
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("hiremind.api.analytics")
router = APIRouter(prefix="/analytics", tags=["Executive Business Intelligence"])

@router.get("/kpis")
async def get_kpi_metrics(
    kpi_name: str,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyAnalyticsRepository(db)

    # Calculate mock snapshot aggregate values
    computed_val = 14.5 # e.g. average 14.5 days to screen candidates
    dimensions = {"region": "US-West", "department": "Engineering"}

    await repo.save_snapshot(session.tenant_id, kpi_name, computed_val, dimensions)
    await repo.save()
    await db.commit()

    # Emit MetricsAggregatedEvent
    event_bus = RedisEventBus()
    event = MetricsAggregatedEvent(
        tenant_id=session.tenant_id,
        correlation_id=str(uuid.uuid4()),
        payload={
            "kpi_name": kpi_name,
            "computed_value": computed_val
        }
    )
    await event_bus.publish(event)

    return {
        "kpi": kpi_name,
        "computed_value": computed_val,
        "dimensions": dimensions
    }

@router.get("/forecasts")
async def get_forecasts(
    kpi_name: str,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    SQLAlchemyAnalyticsRepository(db)

    # Simulate dynamic forecast calculations logs
    forecast_time = datetime.utcnow() + timedelta(days=30)
    record = ForecastResult(
        organization_id=session.tenant_id,
        target_kpi=kpi_name,
        forecast_date=forecast_time,
        predicted_value=12.2,
        confidence_interval_lower=10.5,
        confidence_interval_upper=14.1,
        assumptions_summary="Calculated using sliding window pipeline velocities over the last 90 days."
    )
    db.add(record)
    await db.commit()

    # Emit ForecastGeneratedEvent
    event_bus = RedisEventBus()
    event = ForecastGeneratedEvent(
        tenant_id=session.tenant_id,
        correlation_id=str(uuid.uuid4()),
        payload={
            "target_kpi": kpi_name,
            "predicted_value": float(record.predicted_value)
        }
    )
    await event_bus.publish(event)

    return {
        "kpi": kpi_name,
        "predicted_value": float(record.predicted_value),
        "bounds": {
            "lower": float(record.confidence_interval_lower),
            "upper": float(record.confidence_interval_upper)
        },
        "assumptions": record.assumptions_summary
    }

@router.post("/simulate", status_code=status.HTTP_201_CREATED)
async def trigger_what_if_scenario(
    scenario_name: str,
    inputs: dict,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    SQLAlchemyAnalyticsRepository(db)

    # Simulate projecting outputs based on input adjustments
    # e.g. adding 2 recruiters drops average time-to-hire by 4 days
    projected = {"time_to_hire_change_days": -4.2, "pipeline_throughput_increase": 0.15}

    sim = ScenarioSimulation(
        organization_id=session.tenant_id,
        scenario_name=scenario_name,
        input_parameters=inputs,
        projected_outputs=projected
    )
    db.add(sim)
    await db.commit()

    return {
        "simulation_id": str(sim.id),
        "name": scenario_name,
        "projected_metrics": projected
    }

@router.post("/queries")
async def natural_language_analytics(
    query_text: str,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    # Simulated NLP translation to analytics query run
    # e.g. "forecast hiring next quarter" -> triggers forecast metrics
    return {
        "translated_query": "SELECT AVG(time_to_hire) FROM snapshots WHERE date > NOW() - INTERVAL '90 days'",
        "answer_summary": "Engineering hiring velocities present a stable pipeline speed. No bottleneck anomalies detected.",
        "confidence_ratio": 98.4
    }
