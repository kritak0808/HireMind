import logging
import time
from contextvars import ContextVar
from typing import Any, Dict, Optional

from opentelemetry import trace
from pythonjsonlogger import jsonlogger

# Thread-safe execution request variables
correlation_id_ctx: ContextVar[str] = ContextVar("correlation_id", default="")
tenant_id_ctx: ContextVar[str] = ContextVar("tenant_id", default="")
request_id_ctx: ContextVar[str] = ContextVar("request_id", default="")

# OpenTelemetry SDK and Exporter Imports
try:
    from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
    from opentelemetry.sdk.resources import Resource
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor
except ImportError:
    Resource = None
    TracerProvider = None
    BatchSpanProcessor = None
    OTLPSpanExporter = None

def initialize_telemetry(service_name: str, otlp_endpoint: str = "http://otel-collector:4317") -> None:
    """
    Bootstrap OpenTelemetry provider and hook OTLP span processor to export distributed traces.
    """
    logger = logging.getLogger("hiremind.telemetry")
    if TracerProvider is None or OTLPSpanExporter is None:
        logger.warning("OpenTelemetry components not fully installed. Tracing is disabled.")
        return
    try:
        resource = Resource.create(attributes={"service.name": service_name})
        provider = TracerProvider(resource=resource)
        exporter = OTLPSpanExporter(endpoint=otlp_endpoint, timeout=3)
        processor = BatchSpanProcessor(exporter)
        provider.add_span_processor(processor)
        trace.set_tracer_provider(provider)
        logger.info(f"OpenTelemetry tracing initialized for service: '{service_name}' on OTLP: '{otlp_endpoint}'")
    except Exception as e:
        logger.warning(f"OpenTelemetry initialization failed (running in fallback mode): {str(e)}")


class EnterpriseJsonFormatter(jsonlogger.JsonFormatter):
    """
    Format standard records into structured JSON packets.
    Embeds correlation IDs, tenant IDs, and thread execution context automatically.
    """
    def add_fields(self, log_record: Dict[str, Any], record: logging.LogRecord, message_dict: Dict[str, Any]) -> None:
        super().add_fields(log_record, record, message_dict)
        log_record["timestamp"] = time.strftime('%Y-%m-%dT%H:%M:%S', time.gmtime(record.created)) + f".{int(record.msecs):03d}Z"
        log_record["log_level"] = record.levelname
        log_record["correlation_id"] = correlation_id_ctx.get()
        log_record["tenant_id"] = tenant_id_ctx.get()
        log_record["request_id"] = request_id_ctx.get()

        # Add open telemetry trace parameters if active
        current_span = trace.get_current_span()
        if current_span and current_span.is_recording():
            ctx = current_span.get_span_context()
            log_record["trace_id"] = f"{ctx.trace_id:032x}"
            log_record["span_id"] = f"{ctx.span_id:016x}"

def setup_structured_logging(log_level: int = logging.INFO) -> None:
    """Sets up the global root logger to write logs formatted in clean structured JSON."""
    handler = logging.StreamHandler()
    formatter = EnterpriseJsonFormatter(
        "%(timestamp)s %(log_level)s %(name)s %(message)s"
    )
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.handlers = [handler]
    root_logger.setLevel(log_level)

# AI Telemetry Logger Helper
class AITelemetryTracker:
    """
    Observer wrapper class to log prompt executions, cost profiles, 
    and latencies of LLM completions for auditing.
    """
    def __init__(self, agent_name: str) -> None:
        self.agent_name = agent_name
        self.logger = logging.getLogger(f"ai_telemetry.{agent_name}")

    def track_completion(
        self,
        prompt_tokens: int,
        completion_tokens: int,
        latency_ms: float,
        model_name: str,
        success: bool = True,
        error_message: Optional[str] = None
    ) -> None:
        self.logger.info(
            "AI agent complete run step",
            extra={
                "agent_name": self.agent_name,
                "model_name": model_name,
                "metrics": {
                    "prompt_tokens": prompt_tokens,
                    "completion_tokens": completion_tokens,
                    "total_tokens": prompt_tokens + completion_tokens,
                    "latency_ms": latency_ms
                },
                "status": "success" if success else "failed",
                "error": error_message
            }
        )

# Bridge the package-level shadowed imports
from ai_metrics import AIMetricsTracker  # noqa: F401, E402
from caching import RedisCachingPlatform  # noqa: F401, E402
from deployment import IncidentManagementPlatform, ProductionDeploymentManager, ReleaseOrchestrator, RunbookEngine  # noqa: F401, E402
from resilience import BulkheadManager, CircuitBreaker, CircuitOpenException, RetryOrchestrator  # noqa: F401, E402
from seeding import DemoDataSeeder  # noqa: F401, E402
from validation import CertificationEngine, EvidenceCollector, QualityGateEngine, ValidationOrchestrator  # noqa: F401, E402


