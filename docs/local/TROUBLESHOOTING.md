# Localhost Troubleshooting Guide

Solutions to common issues encountered during local startup.

## 1. Port Collisions (Postgres / Redis)
* **Problem:** Port `5432` or `6379` already in use.
* **Fix:** Stop any local PostgreSQL or Redis services running natively on your system before launching `pnpm dev:all`.

## 2. Docker Out of Memory
* **Problem:** Containers exit with code 137.
* **Fix:** Increase the memory allocated to Docker Desktop (minimum 8GB recommended to run the full monitoring and database stack).

## 3. Qdrant Connection Errors
* **Problem:** API Gateway fails to connect to vector database.
* **Fix:** Verify Qdrant container is active and ports `6333` are open.
