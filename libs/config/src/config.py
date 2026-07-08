import os
from typing import Any, List, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class AppConfig(BaseSettings):
    # Application Context
    ENVIRONMENT: str = Field(default="development", description="Application execution phase: development, staging, production")
    DEBUG: bool = Field(default=True, description="Enable traceback detailing")
    SERVICE_NAME: str = Field(default="hiremind-service")

    # Security & Gateway Parameters
    JWT_SECRET_KEY: str = Field(default="placeholder_super_secret_key_change_in_prod", description="Signing key for JWT claims")
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60)

    # CORS_ORIGINS stored as a single string, parsed via property.
    # Railway/Vercel env vars set this as comma-separated string.
    # e.g. CORS_ORIGINS="https://hiremind.vercel.app,https://preview.vercel.app"
    # pydantic-settings tries to JSON-decode List fields which breaks on plain strings,
    # so we store as str and expose a parsed_cors_origins property.
    CORS_ORIGINS_STR: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000",
        alias="CORS_ORIGINS",
        description="Comma-separated list of allowed CORS origins"
    )

    @property
    def CORS_ORIGINS(self) -> List[str]:
        """Parse comma-separated CORS_ORIGINS string into a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS_STR.split(",") if origin.strip()]

    # Core Relational Storage
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://hiremind_user:hiremind_password@localhost:5432/hiremind_db",
        description="Primary Postgres async connection string"
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def fix_database_url_scheme(cls, v: str) -> str:
        """Railway injects DATABASE_URL with 'postgresql://' or 'postgres://' scheme.
        SQLAlchemy async engine requires 'postgresql+asyncpg://'.
        This validator transparently corrects the scheme at runtime.
        """
        if isinstance(v, str):
            if v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql+asyncpg://", 1)
            if v.startswith("postgresql://"):
                return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    # Cache & Event Infrastructure Broker
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0",
        description="Redis server URL hook"
    )

    # Semantic Index database
    QDRANT_URL: str = Field(
        default="http://localhost:6333",
        description="Vector database API endpoint"
    )
    QDRANT_API_KEY: Optional[str] = Field(default=None)

    # Rate Limiting parameters
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = Field(default=100)

    # Feature flags for runtime changes
    ENABLE_AI_VOICE_STREAMING: bool = Field(default=True)
    ENABLE_REALTIME_TELEMETRY: bool = Field(default=True)

    model_config = SettingsConfigDict(
        env_file=os.getenv("ENV_FILE_PATH", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    @field_validator("ENVIRONMENT")
    @classmethod
    def validate_environment(cls, v: str) -> str:
        valid_envs = ["development", "staging", "production"]
        if v.lower() not in valid_envs:
            raise ValueError(f"ENVIRONMENT must be one of {valid_envs}")
        return v.lower()

# Centralized singleton config accessor
settings = AppConfig()
