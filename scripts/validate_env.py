#!/usr/bin/env python3
import logging
import sys

from config import settings
from telemetry import setup_structured_logging

setup_structured_logging(logging.INFO)
logger = logging.getLogger("hiremind.env_validator")

def validate_environment() -> bool:
    logger.info("Initializing environment configurations verification...")
    errors = 0

    # 1. Check basic properties
    logger.info(f"Target Environment: {settings.ENVIRONMENT}")
    logger.info(f"Service Name: {settings.SERVICE_NAME}")

    # 2. Check essential secrets are set in production
    if settings.ENVIRONMENT == "production":
        if settings.JWT_SECRET_KEY == "placeholder_super_secret_key_change_in_prod":
            logger.error("CRITICAL: JWT_SECRET_KEY remains placeholder in production context!")
            errors += 1

        if "localhost" in settings.DATABASE_URL:
            logger.warn("WARNING: DATABASE_URL appears to target localhost in production context!")

    # 3. Print verification summaries
    if errors > 0:
        logger.error(f"Environment verification failed with {errors} errors.")
        return False

    logger.info("Environment verification successfully completed.")
    return True

if __name__ == "__main__":
    success = validate_environment()
    sys.exit(0 if success else 1)
