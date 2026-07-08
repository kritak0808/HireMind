import logging

from config import settings
from fastapi import FastAPI
from telemetry import setup_structured_logging

setup_structured_logging(logging.DEBUG if settings.DEBUG else logging.INFO)
logger = logging.getLogger("hiremind.agent_orchestrator")

app = FastAPI(
    title="HireMind AI Agent Orchestrator",
    version="1.0.0",
    debug=settings.DEBUG
)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "agent-orchestrator",
        "environment": settings.ENVIRONMENT
    }
