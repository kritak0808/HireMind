# Running HireMind AI Locally

To boot up the entire platform on localhost:

## 1. Single-Command Startup
At the root of the monorepo, execute:
```bash
pnpm dev:all
```
This builds and starts:
* PostgreSQL (port 5432)
* Redis (port 6379)
* Qdrant (port 6333)
* MinIO (port 9000 & 9001)
* Mailpit (port 1025 & 8025)
* API Gateway (port 8000)
* Web UI cockpit (port 3000)
* Grafana (port 3001)

## 2. Seed Mock Data
To populate 1000 candidate profiles, 100 jobs, 400 applications, 250 resumes, and 120 assessments, make a POST request to:
```http
POST http://localhost:8000/api/v1/deployment/simulate/seed
```
Or trigger it directly via the Operations console at `http://localhost:3000/dashboard/deployment/command`.
