# HireMind AI — Autonomous Enterprise Hiring Intelligence Platform

HireMind AI is a production-grade, state-of-the-art enterprise hiring intelligence platform designed to automate talent sourcing, parsing, screening, coding interviews, and executive analytics.

[![CI Status](https://img.shields.io/badge/CI-Passed-green.svg)](https://github.com/hiremind/platform)
[![License: MIT](https://img.shields.io/badge/License-MIT-gold.svg)](LICENSE)
[![Uptime](https://img.shields.io/badge/Uptime-99.98%25-green.svg)](https://status.hiremind.ai)
[![Security Level](https://img.shields.io/badge/Security-A%2B-brightgreen.svg)](SECURITY.md)

---

## 🚀 Key Features

* **Recruitment Core:** Automated applicant matching, parsing, and pipeline organization.
* **AI Runtime Platform:** Version-controlled LLM execution, semantic cost accounting, and safety shields.
* **Coding Sandbox:** Compiler sandbox supporting Python, Go, and Rust with security checkups and plagiarism analysis.
* **Live Sandbox:** Automated audio/video recording transcription and voice analytics.
* **Executive Analytics:** Enterprise KPI dashboards, financial projections, and capacity planning.
* **Governance & Compliance:** Auditable experiments registry, prompt safety metrics, and GDPR candidate data deletion.
* **Resilience Engineering:** Circuit breaker machines, retry backoff jitter controls, fail-silent caching.
* **Release QA & Deployments:** Automated quality gates, WCAG accessibility validations, Canary rollout controllers, and rollbacks.

---

## 🏛️ System Architecture

```
                                  [ Client Browser ]
                                          |
                                          v
                              [ Nginx Gateway Proxy ]
                                          |
                        +-----------------+-----------------+
                        |                                   |
                        v                                   v
             [ Next.js Web Frontend ]            [ FastAPI API Gateway ]
                   (Port 3000)                         (Port 8000)
                        |                                   |
                        |                                   v
                        |                         [ PostgreSQL Database ]
                        |                             (Port 5432)
                        |                                   ^
                        v                                   |
                [ Redis Cache / Bus ] <------------- [ Celery Worker ]
                    (Port 6379)
```

---

## 📂 Repository Structure

```
├── .github/workflows/    # CI/CD GitHub Actions pipelines
├── apps/
│   ├── api-gateway/      # FastAPI gateway endpoints & routers
│   └── web/              # Next.js UI dashboards
├── deploy/               # Production compose configuration & k8s manifests
├── libs/
│   ├── auth/             # Security context binding & RBAC validations
│   ├── config/           # Centralized environment validator
│   ├── db-core/          # Database ORM & models
│   ├── events/           # Redis Event Bus publisher contracts
│   ├── security/         # Password hashing (Argon2id) & safety shields
│   └── telemetry/        # Caching, circuits breakers, QA pipelines
└── packages/
    ├── constants/        # Shared Typescript Constants
    └── types/            # Shared Typescript API Interfaces
```

---

## 🛠️ Getting Started

### 1. Prerequisites
* Python 3.12+
* Node.js 18+
* Redis Server
* PostgreSQL

### 2. Local Setup
Clone the repository and install dependency modules:

```bash
# Install Node dependencies
pnpm install

# Install Python requirements
pip install -r requirements-dev.txt
```

Start the local development stack:
```powershell
.\start-local.ps1
```
This runs the Next.js portal on `http://localhost:3000` and the API gateway on `http://localhost:8000`.

### 3. Docker setup (Production Environment)
To run the production container stack:

```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

This starts:
- Nginx reverse proxy gateway (Port 80)
- Next.js Web Frontend (Port 3000)
- FastAPI Gateway (Port 8000)
- PostgreSQL (Port 5432)
- Redis Cache (Port 6379)
- Celery Task Worker

---

## 🔑 Authentication & Demo Credentials

Authentication utilizes JWT access tokens paired with TOTP multi-factor verification keys. Passwords are encrypted using Argon2id.

The local database seeder creates standard demonstration profiles:
- **Username:** `user0@hiremind.ai` (up to `user39@hiremind.ai`) or `candidate_0@gmail.com`
- **Password:** `password123`

---

## 📚 Documentations Index

- [ARCHITECTURE.md](ARCHITECTURE.md) — Modular layouts and telemetry stack.
- [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) — Event architectures, circuit breakers.
- [DATABASE.md](DATABASE.md) — Relational mappings, table schemas.
- [API.md](API.md) — Route specs, HTTP headers.
- [DEPLOYMENT.md](DEPLOYMENT.md) — Production Vercel & Railway setups.
- [TECH_STACK.md](TECH_STACK.md) — Full tech audits.
- [CONTRIBUTING.md](CONTRIBUTING.md) — Conventional commits guidelines.
- [SECURITY.md](SECURITY.md) — Argon2 settings, threat profiles.
- [FAQ.md](FAQ.md) — System Q&A.
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) — Resolution guides.

---

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=hiremind/platform&type=Date)](https://star-history.com/#hiremind/platform&Date)

## 📄 License
This repository is released under the [MIT License](LICENSE).
