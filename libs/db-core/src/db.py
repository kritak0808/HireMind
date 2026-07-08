import logging
import uuid
from typing import AsyncGenerator

from config import settings
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

logger = logging.getLogger("hiremind.db")

# 1. Initialize Async Engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=10
)

# 2. Construct Thread-safe Session Factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# 3. Base class for all transactional models
class Base(DeclarativeBase):
    pass

# 4. Mixin ensuring model maps target tenant context
class TenantModelMixin:
    organization_id: Mapped[uuid.UUID] = mapped_column(nullable=False, index=True)


# 5. Database Session Generator Dependency
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    HTTP request dependency providing an asynchronous SQLAlchemy database session.
    Commits automatically upon success or rolls back transaction in case of error.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception as e:
            logger.error(f"Transaction failed, rolling back: {str(e)}")
            await session.rollback()
            raise

# 6. Session tenant scope configuration injector
async def set_session_tenant_context(session: AsyncSession, tenant_id: str) -> None:
    """Configures the current session configuration variables for database RLS policies."""
    await session.execute(
        text("SET LOCAL app.current_tenant_id = :tenant_id"),
        {"tenant_id": tenant_id}
    )
