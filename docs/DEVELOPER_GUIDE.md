# HireMind AI Developer Guide
## Workspace Configuration & Architecture Setup

This guide assists engineers in setting up and developing for the HireMind AI platform workspace.

---

## 1. Development Prerequisites
- **Node.js**: Version 18.x or 20.x
- **Python**: Version 3.12.x
- **PNPM**: Package manager version 8.x or 9.x
- **PostgreSQL & Redis**: Running locally or via Docker Compose.

---

## 2. Directory Structure

```
├── apps/
│   ├── api-gateway/         # FastAPI backend application
│   └── web/                 # Next.js web dashboard frontend
├── libs/
│   ├── auth/                # Session security context
│   ├── config/              # Central validator configurations
│   ├── db-core/             # Database ORM classes & models
│   ├── telemetry/           # Observability, caching, & resilience classes
│   └── shared-schemas/      # Pydantic schema validation structures
└── packages/
    ├── constants/           # Shared TS constants
    └── types/               # Shared TS interfaces
```

---

## 3. Local Installation & Run Configuration

Install workspace dependencies:
```bash
pnpm install
```

Configure local python virtual environment:
```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements-dev.txt
```

Run local development services:
```powershell
.\start-local.ps1
```

---

## 4. Run Pytest Suite
```bash
$env:PYTHONPATH="apps/api-gateway/src;libs/config/src;libs/telemetry/src;libs/security/src;libs/auth/src;libs/db-core/src;libs/shared-schemas/src;libs/events/src"
python -m pytest
```
Ensure all 56+ assertions pass before opening pull requests.
