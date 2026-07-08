# HireMind AI — Tech Stack Audit

This document details the software libraries, frameworks, tools, and systems that power the HireMind AI platform.

## Frontend Technology Stack

| Layer | Technology / Library | Version | Description |
| --- | --- | --- | --- |
| **Core Framework** | React | `^19.0.0` | Declarative UI structure and component state management. |
| **Meta Framework** | Next.js | `^15.0.0` | SSR, routing, static generation, API routes, middleware. |
| **State Management**| Zustand | `^4.5.0` | Minimal, fast, and light-weight global client state manager. |
| **Aesthetics / Styling** | Vanilla CSS + Tailwind | `^4.3.2` | Elegant theme styling using Tailwind variables and clean utility tokens. |
| **Animations** | Framer Motion | `^11.0.0` | Fluid CSS layout updates and component page transits. |
| **Icons** | Lucide React | `^0.300.0` | Consistent vector icons system mapping all dashboards. |
| **Build Tools** | pnpm, Turborepo | `9.x`, `^2.0` | Monorepo build orchestrator, fast caching, workspace linking. |

## Backend Technology Stack

| Layer | Technology / Library | Version | Description |
| --- | --- | --- | --- |
| **Core Framework** | FastAPI | `0.110.0` | Async server routing, open API support, schema validation. |
| **Asynchronous Server** | Uvicorn | `0.28.0` | High-performance ASGI web server wrapper. |
| **Serialization** | Pydantic (v2) | `2.6.4` | Data parser, type validator, settings parser. |
| **Database ORM** | SQLAlchemy (asyncio) | `2.0.29` | Flexible relational engine with async session mappings. |
| **Migrations** | Alembic | `1.13.1` | SQL schema migration tracker. |
| **Task Queue** | Celery | `5.3.6` | Background job execution engine for long-running workflows. |
| **HTTP Client** | HTTPX | `0.27.0` | Async HTTP requests runner. |
| **Structured Logs** | Structlog | `24.1.0` | Production JSON logging framework. |

## Data & Infrastructure Stack

| Service | Technology | Version | Purpose |
| --- | --- | --- | --- |
| **Primary Relational DB**| PostgreSQL | `16-alpine` | Stateful application database with asyncpg access. |
| **Cache & Event Bus** | Redis | `7-alpine` | Transient caching platform and celery task broker. |
| **Vector Index** | Qdrant | `v1.9.0` | High-dimensional semantic search and candidate embeddings database. |
| **Object Store** | MinIO (S3-compatible) | `2024-01-28` | Local file server proxy hosting resume uploads and media records. |
| **Reverse Proxy** | Nginx | `1.25-alpine` | Standard reverse proxy mapping frontend, websocket, and api gateway. |
| **Email Server** | Mailpit | `v1.15` | SMTP testing backend mock for developer alerts verification. |

## Telemetry & Quality Assurance Stack

| Layer | Tool | Version | Purpose |
| --- | --- | --- | --- |
| **Distributed Tracing** | OpenTelemetry | `1.24.0` | Telemetry framework tracing gateway requests. |
| **Metrics Database** | Prometheus | `v2.50.0` | Scraper monitoring memory consumption and HTTP latency metrics. |
| **Visual Boards** | Grafana | `10.3.3` | Analytics charts detailing system availability. |
| **Traces Collector** | Jaeger | `1.55` | Distributed logs visualizer. |
| **Log Management** | Loki | `2.9.4` | Log aggregation engine. |
| **Python Testing** | Pytest | `^9.0` | Python test runner (56+ test items). |
| **Linter** | Ruff | `^0.3` | Ultra-fast Python check tool formatting imports and compliance. |
| **Formatter** | Black | `^24.2` | Standard Python PEP-8 code styling formatting. |
