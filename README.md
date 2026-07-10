# HireMind AI

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" />
  <img src="https://img.shields.io/badge/FastAPI-Production-009688?logo=fastapi" />
  <img src="https://img.shields.io/badge/Python-3.12-blue?logo=python" />
  <img src="https://img.shields.io/badge/PostgreSQL-17-336791?logo=postgresql" />
  <img src="https://img.shields.io/badge/Redis-7-red?logo=redis" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" />
  <img src="https://img.shields.io/badge/License-MIT-green" />
</p>

<p align="center">
<b>Enterprise AI Recruitment Operating System</b><br>
A production-grade AI-powered Applicant Tracking System (ATS) built with FastAPI, Next.js 15, PostgreSQL, Redis, and modern LLM technologies.
</p>

---

# Overview

HireMind AI is an enterprise-grade Recruitment Operating System designed to streamline the entire hiring lifecycle through artificial intelligence, workflow automation, and modern cloud-native architecture.

The platform combines a powerful Applicant Tracking System (ATS), AI Resume Intelligence, Semantic Candidate Search, AI Copilot, Enterprise Collaboration, Analytics, Governance, and SaaS capabilities into a single scalable platform.

Designed using a modular monorepo architecture, HireMind AI emphasizes scalability, maintainability, observability, and production readiness.

---

# Key Features

## Recruitment Platform

- AI-powered Applicant Tracking System (ATS)
- Job Creation & Management
- Candidate Management
- Resume Upload & Parsing
- Candidate Pipeline Management
- Interview Scheduling
- Interview Scorecards
- Hiring Workflow Automation
- Recruiter Dashboard
- Bulk Candidate Actions

---

## AI Intelligence

- AI Resume Parsing
- ATS Resume Scoring
- Semantic Candidate Search
- Candidate Matching Engine
- AI Hiring Copilot
- Resume Skill Extraction
- AI Recommendations
- Explainable Candidate Rankings
- Multi-LLM Gateway
- Retrieval-Augmented Generation (RAG)

Supported AI Providers

- OpenAI
- Google Gemini
- Anthropic Claude
- Cohere

---

## Enterprise Workspace

- Recruiter Operating Cockpit
- Team Collaboration
- Activity Timeline
- Calendar Management
- Notifications
- Email Templates
- Candidate Notes
- Interview Kits
- SLA Tracking

---

## Security & Identity

- JWT Authentication
- Refresh Tokens
- Password Hashing (Argon2)
- RBAC (Role-Based Access Control)
- Organization Isolation
- Multi-Tenant Support
- API Keys
- Secure Sessions

---

## SaaS Platform

- Organization Management
- Enterprise Billing
- Marketplace Integrations
- Developer Portal
- API Management
- Workspace Administration
- Usage Tracking
- Subscription Management

---

## Analytics

- Recruitment Dashboard
- Hiring Funnel Analytics
- Candidate Analytics
- Performance Metrics
- Team Productivity
- AI Usage Metrics
- Recruitment KPIs
- Operational Reports

---

## Observability & Reliability

- OpenTelemetry
- Structured Logging
- Prometheus Metrics
- Health Monitoring
- Incident Tracking
- Performance Dashboard
- Load Testing
- Recovery Monitoring

---

# Technology Stack

## Frontend

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion
- Zustand
- Lucide React

---

## Backend

- FastAPI
- Python 3.12
- SQLAlchemy
- AsyncPG
- PostgreSQL
- Redis
- Pydantic v2
- Celery
- JWT Authentication

---

## AI & ML

- OpenAI API
- Google Gemini
- Anthropic Claude
- Cohere
- RAG Pipeline
- Prompt Registry
- Vector Search
- AI Evaluation Framework

---

## DevOps & Infrastructure

- Docker
- Railway
- Vercel
- GitHub Actions
- OpenTelemetry
- Prometheus

---

# System Architecture

```text
                        HireMind AI

                  ┌────────────────────┐
                  │    Next.js Client  │
                  └──────────┬─────────┘
                             │
                             ▼
                 ┌────────────────────────┐
                 │ FastAPI API Gateway    │
                 └──────────┬─────────────┘
                            │
      ┌─────────────────────┼─────────────────────┐
      │                     │                     │
      ▼                     ▼                     ▼
 Authentication       Recruitment Engine      AI Services
      │                     │                     │
      ▼                     ▼                     ▼
 PostgreSQL             Redis Cache         LLM Gateway
                                                  │
                        ┌─────────────┬───────────────┬─────────────┐
                        ▼             ▼               ▼             ▼
                     OpenAI        Gemini         Claude        Cohere
```

---

# Project Structure

```text
HireMind
│
├── apps
│   ├── api-gateway
│   └── web
│
├── libs
│   ├── auth
│   ├── config
│   ├── db-core
│   ├── events
│   ├── sdk
│   ├── security
│   ├── shared-schemas
│   ├── telemetry
│   └── ui
│
├── packages
│   ├── constants
│   ├── types
│   └── utilities
│
├── docs
├── infrastructure
├── docker-compose.yml
├── railway.toml
├── vercel.json
├── pnpm-workspace.yaml
└── README.md
```

---

# Getting Started

## Clone the Repository

```bash
git clone https://github.com/kritak0808/HireMind.git

cd HireMind
```

---

## Install Dependencies

```bash
pnpm install
```

---

## Start Backend

```bash
cd apps/api-gateway/src

python -m uvicorn main:app --reload
```

---

## Start Frontend

```bash
cd apps/web

pnpm dev
```

---

# Environment Variables

## Backend

```env
DATABASE_URL=

REDIS_URL=

JWT_SECRET_KEY=

OPENAI_API_KEY=

GEMINI_API_KEY=

COHERE_API_KEY=

SMTP_HOST=

SMTP_PORT=

SMTP_USER=

SMTP_PASSWORD=

MINIO_ENDPOINT=

MINIO_ACCESS_KEY=

MINIO_SECRET_KEY=

CORS_ORIGINS=
```

---

## Frontend

```env
NEXT_PUBLIC_API_URL=
```

---

# API Documentation

FastAPI automatically generates interactive API documentation.

```text
http://localhost:8000/docs
```

OpenAPI schema:

```text
http://localhost:8000/openapi.json
```

---

# Testing

Run the complete backend test suite:

```bash
pytest
```

Run linting:

```bash
python -m ruff check
```

Build the frontend:

```bash
pnpm build
```

---

# Project Highlights

- Enterprise-scale monorepo architecture
- AI-powered Applicant Tracking System
- Resume Intelligence Engine
- Semantic Candidate Search
- AI Copilot & Multi-LLM Support
- Enterprise SaaS Architecture
- Multi-Tenant Workspace
- JWT Authentication & RBAC
- Recruiter Collaboration Suite
- Analytics & Performance Dashboards
- OpenTelemetry Observability
- Production-ready FastAPI Backend
- Modern Next.js 15 Frontend
- Scalable PostgreSQL Data Layer
- Redis-backed Background Processing

---

# Roadmap

- AI Interview Assistant
- Voice Interview Analysis
- AI Job Description Generator
- Resume Recommendation Engine
- AI Hiring Forecasting
- Advanced Workflow Automation
- Calendar Integrations
- HRMS Integrations
- Mobile Application
- Advanced Analytics & BI

---

# Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your branch
5. Open a Pull Request

Please ensure that all tests pass before submitting changes.

---

# License

This project is licensed under the MIT License.

---

# Author

**Kritak Prasad**

B.Tech Computer Science & Engineering  
SRM Institute of Science and Technology

- GitHub: https://github.com/kritak0808

---

<p align="center">
<b>HireMind AI</b><br>
Enterprise AI Recruitment Operating System
</p>
