import uuid
from typing import List, Optional

from models import AutomationRule, ConversationHistory, CopilotSession, WorkflowExecution
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select


class SQLAlchemyCopilotRepository:
    """SQLAlchemy implementation of Recruiter Copilot database access."""
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_session(self, session_id: uuid.UUID) -> Optional[CopilotSession]:
        stmt = select(CopilotSession).where(CopilotSession.id == session_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_messages(self, session_id: uuid.UUID) -> List[ConversationHistory]:
        stmt = select(ConversationHistory).where(ConversationHistory.session_id == session_id).order_by(ConversationHistory.created_at.asc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def add_message(self, session_id: uuid.UUID, sender: str, text: str, intent: Optional[str] = None) -> ConversationHistory:
        record = ConversationHistory(
            session_id=session_id,
            sender_role=sender,
            message_content=text,
            intent_detected=intent
        )
        self.session.add(record)
        return record

    async def save_workflow_execution(self, session_id: uuid.UUID, workflow_type: str, params: dict) -> WorkflowExecution:
        record = WorkflowExecution(
            session_id=session_id,
            workflow_type=workflow_type,
            parameters_payload=params,
            status="pending"
        )
        self.session.add(record)
        return record

    async def list_automation_rules(self, organization_id: uuid.UUID) -> List[AutomationRule]:
        stmt = select(AutomationRule).where(AutomationRule.organization_id == organization_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def save(self) -> None:
        await self.session.flush()

    async def commit(self) -> None:
        await self.session.commit()
