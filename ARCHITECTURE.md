# Core Architecture Specification

This document details the modular layout, package structures, and request-response context workflows of the HireMind AI platform.

## Modular Layer Layout

The project is structured as a pnpm-managed monorepo with separated backend services and libraries:

```
.
├── apps/
│   ├── api-gateway/         # FastAPI gateway routing requests & authentication
│   └── web/                 # Next.js frontend user dashboard portal
├── libs/
│   ├── auth/                # Security context binding & RBAC validations
│   ├── config/              # Centralized environment validator
│   ├── db-core/             # Database ORM, migrations, and model entities
│   ├── events/              # Redis Event Bus publisher contracts
│   ├── security/            # Password hashing (Argon2id) & safety shields
│   └── telemetry/           # Observability, caching, and database seeding
└── packages/
    ├── constants/           # Shared Typescript Constants
    └── types/               # Shared Typescript API Interfaces
```

---

## Request Context & Telemetry Binding

Observability logs bind correlation IDs and tenant identifiers across async call stacks using `ContextVar`:

```
[ HTTP Request ] 
      |
      v
( API Gateway Middleware ) ---> Generate Request ID & bind correlation_id_ctx
      |
      v
( Auth Verification )    ---> Decode JWT, verify role, & bind tenant_id_ctx
      |
      v
( Structlog Formatter )  ---> Automatically formats logs containing:
                              {
                                "correlation_id": "...",
                                "tenant_id": "...",
                                "log_level": "INFO",
                                "message": "..."
                              }
```

This ensures complete auditing traces for compliance without requiring programmers to manually pass context arguments to database query functions or logging instances.
