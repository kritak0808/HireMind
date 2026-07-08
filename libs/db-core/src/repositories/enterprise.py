import uuid
from typing import List, Optional

from models import FeatureFlag, IntegrationConnector, Invoice, OrganizationSettings, WebhookEndpoint
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select


class SQLAlchemyEnterpriseRepository:
    """SQLAlchemy implementation of Enterprise Platform database access."""
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    # ─── Organization Settings ────────────────────────────────────────────────
    async def get_org_settings(self, organization_id: uuid.UUID) -> Optional[OrganizationSettings]:
        stmt = select(OrganizationSettings).where(OrganizationSettings.organization_id == organization_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def upsert_org_settings(self, organization_id: uuid.UUID, locale: str, branding_url: Optional[str]) -> OrganizationSettings:
        existing = await self.get_org_settings(organization_id)
        if existing:
            existing.localization_locale = locale
            if branding_url:
                existing.workspace_branding_url = branding_url
            return existing
        record = OrganizationSettings(
            organization_id=organization_id,
            localization_locale=locale,
            workspace_branding_url=branding_url
        )
        self.session.add(record)
        return record

    # ─── Feature Flags ────────────────────────────────────────────────────────
    async def list_feature_flags(self, organization_id: uuid.UUID) -> List[FeatureFlag]:
        stmt = select(FeatureFlag).where(FeatureFlag.organization_id == organization_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def toggle_feature_flag(self, organization_id: uuid.UUID, flag_key: str, enabled: bool) -> FeatureFlag:
        stmt = select(FeatureFlag).where(
            FeatureFlag.organization_id == organization_id,
            FeatureFlag.flag_key == flag_key
        )
        result = await self.session.execute(stmt)
        flag = result.scalar_one_or_none()
        if flag:
            flag.is_enabled = enabled
            return flag
        flag = FeatureFlag(
            organization_id=organization_id,
            flag_key=flag_key,
            is_enabled=enabled
        )
        self.session.add(flag)
        return flag

    # ─── Integration Connectors ───────────────────────────────────────────────
    async def list_connectors(self, organization_id: uuid.UUID) -> List[IntegrationConnector]:
        stmt = select(IntegrationConnector).where(IntegrationConnector.organization_id == organization_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def register_connector(self, organization_id: uuid.UUID, connector_type: str, credentials: dict) -> IntegrationConnector:
        record = IntegrationConnector(
            organization_id=organization_id,
            connector_type=connector_type,
            credentials_payload=credentials,
            is_connected=True
        )
        self.session.add(record)
        return record

    # ─── Webhook Endpoints ────────────────────────────────────────────────────
    async def list_webhooks(self, organization_id: uuid.UUID) -> List[WebhookEndpoint]:
        stmt = select(WebhookEndpoint).where(WebhookEndpoint.organization_id == organization_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def register_webhook(self, organization_id: uuid.UUID, url: str, secret: str, events: list) -> WebhookEndpoint:
        record = WebhookEndpoint(
            organization_id=organization_id,
            url_callback=url,
            secret_signature=secret,
            events_subscribed=events,
            is_active=True
        )
        self.session.add(record)
        return record

    # ─── Billing ──────────────────────────────────────────────────────────────
    async def list_invoices(self, organization_id: uuid.UUID) -> List[Invoice]:
        stmt = select(Invoice).where(Invoice.organization_id == organization_id).order_by(Invoice.created_at.desc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def save(self) -> None:
        await self.session.flush()

    async def commit(self) -> None:
        await self.session.commit()
