import uuid
from typing import Optional

from models import AIUsageRecord, MemoryRecord, ModelProvider, PromptTemplate, PromptVersion
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select


class SQLAlchemyAIRepository:
    """SQLAlchemy implementation of AI configuration database access."""
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_active_prompt(self, template_name: str) -> Optional[str]:
        """Looks up the currently active string content for a prompt template."""
        stmt = (
            select(PromptVersion.template_content)
            .join(PromptVersion.template)
            .where(PromptTemplate.name == template_name, PromptVersion.is_active)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_model_routing_parameters(self, model_name: str) -> Optional[dict]:
        """Retrieves cost weights and status parameters for LLM routing."""
        stmt = select(ModelProvider).where(ModelProvider.model_name == model_name)
        result = await self.session.execute(stmt)
        provider = result.scalar_one_or_none()
        if not provider or not provider.is_active:
            return None
        return {
            "model_name": provider.model_name,
            "provider": provider.provider_name,
            "input_cost": float(provider.input_cost_per_million),
            "output_cost": float(provider.output_cost_per_million)
        }

    async def save_episodic_memory(self, user_id: uuid.UUID, session_id: uuid.UUID, memory_type: str, content: str) -> MemoryRecord:
        """Stores short/long-term context summaries in the relational store."""
        record = MemoryRecord(
            user_id=user_id,
            session_id=session_id,
            memory_type=memory_type,
            content=content
        )
        self.session.add(record)
        return record

    async def add_usage_metrics(self, user_id: uuid.UUID, model_name: str, prompt_tokens: int, completion_tokens: int, cost: float) -> AIUsageRecord:
        """Appends costs ledger metrics after model invocation loops."""
        usage = AIUsageRecord(
            user_id=user_id,
            model_name=model_name,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_cost=cost
        )
        self.session.add(usage)
        return usage

    async def save(self) -> None:
        await self.session.flush()
