import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from .base_model import Base, TenantModelMixin


class OrganizationSettings(Base, TenantModelMixin):
    __tablename__ = "enterprise_org_settings"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    workspace_branding_url: Mapped[str] = mapped_column(String(255), nullable=True)
    localization_locale: Mapped[str] = mapped_column(String(10), default="en-US")
    compliance_policies_payload: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class SubscriptionPlan(Base):
    __tablename__ = "enterprise_subscription_plans"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. 'Enterprise Plus'
    seat_limit: Mapped[int] = mapped_column(Integer, default=5)
    monthly_price: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)
    features_entitlements: Mapped[dict] = mapped_column(JSON, default=dict) # e.g. {"resume_parsing": true}

class Invoice(Base, TenantModelMixin):
    __tablename__ = "enterprise_invoices"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    stripe_invoice_id: Mapped[str] = mapped_column(String(100), nullable=True)
    amount_paid: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)
    status: Mapped[str] = mapped_column(String(50), default="paid") # 'paid', 'open', 'uncollectible'
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class WebhookEndpoint(Base, TenantModelMixin):
    __tablename__ = "enterprise_webhook_endpoints"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    url_callback: Mapped[str] = mapped_column(String(255), nullable=False)
    secret_signature: Mapped[str] = mapped_column(String(128), nullable=False)
    events_subscribed: Mapped[dict] = mapped_column(JSON, default=list) # e.g. ["resume.uploaded"]
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class IntegrationConnector(Base, TenantModelMixin):
    __tablename__ = "enterprise_integration_connectors"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    connector_type: Mapped[str] = mapped_column(String(100), nullable=False) # 'hris', 'calendar', 'outlook'
    credentials_payload: Mapped[dict] = mapped_column(JSON, default=dict) # encrypted references
    is_connected: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class FeatureFlag(Base, TenantModelMixin):
    __tablename__ = "enterprise_feature_flags"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    flag_key: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. 'ai-resumes-v2'
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    rules_payload: Mapped[dict] = mapped_column(JSON, default=dict) # rollout percentages, regions targets
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
