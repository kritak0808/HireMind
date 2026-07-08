import asyncio
import logging
import time
import uuid
from typing import Any

# MUST be first — injects lib paths before any HireMind imports
import path_setup  # noqa: F401
from config import settings
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from routers.ai import router as ai_router
from routers.ai_governance import router as ai_governance_router
from routers.ai_mlops import router as ai_mlops_router
from routers.ai_rag import router as ai_rag_router
from routers.analytics import router as analytics_router
from routers.apikeys import router as apikeys_router
from routers.applications import router as applications_router
from routers.auth import router as auth_router
from routers.candidates import router as candidates_router
from routers.candidates_intelligence import router as candidates_intelligence_router
from routers.coding import router as coding_router
from routers.copilot import router as copilot_router
from routers.deployment import router as deployment_router
from routers.enterprise import router as enterprise_router
from routers.governance import router as governance_router
from routers.interviews import router as interviews_router
from routers.jobs import router as jobs_router
from routers.media import router as media_router
from routers.orgs import router as orgs_router
from routers.performance import router as performance_router
from routers.realtime import listen_to_redis_events
from routers.realtime import router as realtime_router
from routers.resumes import router as resumes_router
from routers.saas_billing import router as saas_billing_router
from routers.saas_developer import router as saas_developer_router
from routers.saas_identity import router as saas_identity_router
from routers.saas_marketplace import router as saas_marketplace_router
from routers.saas_orgs import router as saas_orgs_router
from routers.saas_rbac import router as saas_rbac_router
from routers.search import router as search_router
from routers.sessions import router as sessions_router
from routers.validation import router as validation_router
from routers.workspace import router as workspace_router
from routers.workspace_calendar import router as workspace_calendar_router
from routers.workspace_collab import router as workspace_collab_router
from routers.workspace_email import router as workspace_email_router
from routers.workspace_kits import router as workspace_kits_router
from telemetry import correlation_id_ctx, initialize_telemetry, request_id_ctx, setup_structured_logging

# 1. Setup Global Structured Logging
setup_structured_logging(logging.DEBUG if settings.DEBUG else logging.INFO)
initialize_telemetry(settings.SERVICE_NAME)
logger = logging.getLogger("hiremind.api_gateway")

# 2. Instantiate FastAPI App
app = FastAPI(
    title="HireMind AI API Gateway",
    version="1.0.0",
    debug=settings.DEBUG
)

# OpenTelemetry Instrumentation
try:
    from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
    FastAPIInstrumentor.instrument_app(app)
    logger.info("FastAPI application instrumented with OpenTelemetry.")
except Exception as e:
    logger.warning(f"Could not instrument FastAPI application with OpenTelemetry: {str(e)}")

@app.on_event("startup")
async def startup_event():
    # Trigger local Redis pub/sub realtime subscriber listener loop
    asyncio.create_task(listen_to_redis_events())


# 3. Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Observability Middleware (Correlation IDs & Tenant ID propagation)
@app.middleware("http")
async def add_observability_context(request: Request, call_next: Any) -> Response:
    req_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    corr_id = request.headers.get("X-Correlation-ID", req_id)

    request_id_token = request_id_ctx.set(req_id)
    correlation_id_token = correlation_id_ctx.set(corr_id)

    logger.debug(f"Intercepted HTTP request: {request.method} {request.url.path}")

    start_time = time.time()
    try:
        response = await call_next(request)
        duration = time.time() - start_time
        response.headers["X-Request-ID"] = req_id
        response.headers["X-Correlation-ID"] = corr_id
        logger.info(
            f"HTTP Request Completed: {request.method} {request.url.path} Status: {response.status_code} in {duration:.4f}s"
        )
        return response
    except Exception as e:
        duration = time.time() - start_time
        logger.error(
            f"HTTP Request Failed: {request.method} {request.url.path} Error: {str(e)} in {duration:.4f}s",
            exc_info=True
        )
        raise
    finally:
        request_id_ctx.reset(request_id_token)
        correlation_id_ctx.reset(correlation_id_token)

# 5. Mount API Routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(orgs_router, prefix="/api/v1")
app.include_router(apikeys_router, prefix="/api/v1")
app.include_router(sessions_router, prefix="/api/v1")
app.include_router(jobs_router, prefix="/api/v1")
app.include_router(candidates_router, prefix="/api/v1")
app.include_router(applications_router, prefix="/api/v1")
app.include_router(search_router, prefix="/api/v1")
app.include_router(ai_router, prefix="/api/v1")
app.include_router(resumes_router, prefix="/api/v1")
app.include_router(candidates_intelligence_router, prefix="/api/v1")
app.include_router(interviews_router, prefix="/api/v1")
app.include_router(media_router, prefix="/api/v1")
app.include_router(coding_router, prefix="/api/v1")
app.include_router(copilot_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(enterprise_router, prefix="/api/v1")
app.include_router(governance_router, prefix="/api/v1")
app.include_router(performance_router, prefix="/api/v1")
app.include_router(validation_router, prefix="/api/v1")
app.include_router(deployment_router, prefix="/api/v1")
app.include_router(workspace_router, prefix="/api/v1")
app.include_router(workspace_calendar_router, prefix="/api/v1")
app.include_router(workspace_email_router, prefix="/api/v1")
app.include_router(workspace_kits_router, prefix="/api/v1")
app.include_router(realtime_router, prefix="/api/v1")
app.include_router(workspace_collab_router, prefix="/api/v1")
app.include_router(saas_identity_router, prefix="/api/v1")
app.include_router(saas_orgs_router, prefix="/api/v1")
app.include_router(saas_rbac_router, prefix="/api/v1")
app.include_router(saas_billing_router, prefix="/api/v1")
app.include_router(saas_marketplace_router, prefix="/api/v1")
app.include_router(saas_developer_router, prefix="/api/v1")
app.include_router(ai_governance_router, prefix="/api/v1")
app.include_router(ai_rag_router, prefix="/api/v1")
app.include_router(ai_mlops_router, prefix="/api/v1")

# 6. Core Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.SERVICE_NAME,
        "environment": settings.ENVIRONMENT
    }
