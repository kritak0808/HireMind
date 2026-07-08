# libs/telemetry

This shared module contains observability tools, metrics exporters, and structural log formatters.

## Core Responsibilities
- **Distributed Tracing:** Instruments API paths using OpenTelemetry to isolate latency bottlenecks.
- **Log Formatting:** Serializes program diagnostics to structured JSON streams containing timestamp, log level, trace context, and tenant headers.
- **System Metrics Exporter:** Tracks container system resources during remote code validation.
