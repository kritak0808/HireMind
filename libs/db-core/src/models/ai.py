import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base_model import Base, TenantModelMixin


class AgentModel(Base, TenantModelMixin):
    __tablename__ = "ai_agents"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    versions: Mapped[list["AgentVersion"]] = relationship(back_populates="agent", cascade="all, delete-orphan")

class AgentVersion(Base):
    __tablename__ = "ai_agent_versions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    agent_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ai_agents.id", ondelete="CASCADE"), nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    configuration_payload: Mapped[dict] = mapped_column(JSON, default=dict) # Capabilities, tools metadata
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    agent: Mapped[AgentModel] = relationship(back_populates="versions")

class AgentExecution(Base, TenantModelMixin):
    __tablename__ = "ai_agent_executions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    agent_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ai_agents.id", ondelete="CASCADE"), nullable=False)
    session_id: Mapped[uuid.UUID] = mapped_column(nullable=False, index=True) # Pipeline/Interview session id
    input_payload: Mapped[dict] = mapped_column(JSON, default=dict)
    output_payload: Mapped[dict] = mapped_column(JSON, default=dict)
    latency_ms: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class WorkflowModel(Base, TenantModelMixin):
    __tablename__ = "ai_workflows"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    graph_definition: Mapped[dict] = mapped_column(JSON, default=dict) # LangGraph sequence nodes
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class PromptTemplate(Base):
    __tablename__ = "ai_prompt_templates"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    versions: Mapped[list["PromptVersion"]] = relationship(back_populates="template", cascade="all, delete-orphan")

class PromptVersion(Base):
    __tablename__ = "ai_prompt_versions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    template_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ai_prompt_templates.id", ondelete="CASCADE"), nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    template_content: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    template: Mapped[PromptTemplate] = relationship(back_populates="versions")

class ModelProvider(Base):
    __tablename__ = "ai_model_providers"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    provider_name: Mapped[str] = mapped_column(String(50), nullable=False) # 'openai', 'gemini'
    model_name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    input_cost_per_million: Mapped[float] = mapped_column(Numeric(10, 4), default=0.0)
    output_cost_per_million: Mapped[float] = mapped_column(Numeric(10, 4), default=0.0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

class MemoryRecord(Base, TenantModelMixin):
    __tablename__ = "ai_memory_records"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    session_id: Mapped[uuid.UUID] = mapped_column(nullable=False, index=True)
    memory_type: Mapped[str] = mapped_column(String(50), nullable=False) # 'episodic', 'conversational'
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class AIUsageRecord(Base, TenantModelMixin):
    __tablename__ = "ai_usage_records"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    prompt_tokens: Mapped[int] = mapped_column(Integer, default=0)
    completion_tokens: Mapped[int] = mapped_column(Integer, default=0)
    total_cost: Mapped[float] = mapped_column(Numeric(12, 6), default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
