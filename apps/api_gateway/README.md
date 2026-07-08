# apps/api-gateway

This directory hosts the primary REST & WebSocket entry point for transactional application operations, built with **FastAPI**.

## Core Responsibilities
- **Request Routing & Safety Check:** Coordinates security headers, CORS permissions, and limits request rates.
- **Tenant Scope Resolution:** Scopes incoming requests to target `tenant_id` blocks through JWT validation middleware.
- **Background Tasks Dispatch:** Offloads complex workflows (e.g. resume extraction, report composition) to Celery nodes.

## Structural Outline
```
.
├── src/
│   ├── config/        # Environment configurations
│   ├── middleware/    # Tenant isolation validation checks
│   ├── routers/       # API resource router nodes
│   └── main.py        # Gateway initialization file
├── Dockerfile
├── requirements.txt
└── pyproject.toml
```
