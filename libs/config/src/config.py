import os
from typing import List, Optional

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

    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"],
        description="Allowed origins for security validations"
    )

    # Core Relational Storage
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://hiremind_user:hiremind_password@localhost:5432/hiremind_db",
        description="Primary Postgres async connection string"
    )

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
        extra="ignore"
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
