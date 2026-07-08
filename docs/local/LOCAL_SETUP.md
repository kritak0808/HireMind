# Local Setup Guide - HireMind AI

This document provides setup instructions to run the HireMind AI platform locally.

## System Prerequisites
Ensure the following tools are installed:
* **Docker & Docker Compose:** Containerization engine.
* **Node.js v18+ & pnpm:** Next.js package manager.
* **Python 3.12+:** FastAPI environment.

## 1. Environment Config
Copy the example environment settings to active profiles:
```bash
cp .env.example .env.local
cp .env.example .env.development
```

## 2. Docker Compose Infrastructure
Launch Postgres, Redis, Qdrant, MinIO, Mailpit, and otel collectors:
```bash
pnpm dev:all
```
This single command spins up all 14 local containers, runs Alembic schema migrations, and exposes services on localhost ports.
