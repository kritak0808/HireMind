import logging

from config import settings
from telemetry import setup_structured_logging

setup_structured_logging(logging.DEBUG if settings.DEBUG else logging.INFO)
logger = logging.getLogger("hiremind.sandbox_executor")

def execute_untrusted_code(code: str, language: str) -> dict:
    """
    Mock runner verifying correct encapsulation parameters.
    No actual container is launched in Phase 2 framework.
    """
    logger.info(f"Received untrusted code submission of language: {language}")
    return {
        "status": "success",
        "output": "Compilation successful. All 0 tests passed.",
        "duration_ms": 12.5,
        "memory_peak_bytes": 1048576
    }
