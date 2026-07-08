import uuid
from typing import List, Optional

from models import AnalyticsSnapshot, DashboardConfig, ForecastResult, KPIDefinition
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select


class SQLAlchemyAnalyticsRepository:
    """SQLAlchemy implementation of Executive Analytics database access."""
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_dashboard(self, dashboard_id: uuid.UUID) -> Optional[DashboardConfig]:
        stmt = select(DashboardConfig).where(DashboardConfig.id == dashboard_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_kpi_definitions(self, organization_id: uuid.UUID) -> List[KPIDefinition]:
        stmt = select(KPIDefinition).where(KPIDefinition.organization_id == organization_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def save_snapshot(self, org_id: str, kpi_name: str, value: float, dimensions: dict) -> AnalyticsSnapshot:
        record = AnalyticsSnapshot(
            organization_id=org_id,
            kpi_name=kpi_name,
            computed_value=value,
            dimensions_payload=dimensions
        )
        self.session.add(record)
        return record

    async def list_forecasts(self, kpi_name: str) -> List[ForecastResult]:
        stmt = select(ForecastResult).where(ForecastResult.target_kpi == kpi_name).order_by(ForecastResult.forecast_date.asc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def save(self) -> None:
        await self.session.flush()

    async def commit(self) -> None:
        await self.session.commit()
