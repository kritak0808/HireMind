# Production Deployment Guide

This document describes how to deploy the HireMind AI platform to enterprise cloud environments.

## Deployment Architecture

In a production environment, the platform is structured as follows:

```
[ Client Browser ] ---> [ Nginx Proxy / Cloudflare ]
                              |
            +-----------------+-----------------+
            |                                   |
            v                                   v
    [ Web Frontend ]                     [ API Gateway ]
     (Next.js App)                        (FastAPI App)
    Hosted on Vercel                      Hosted on Railway
            |                                   |
            v                                   v
    [ API endpoints ] ---> [ Redis ] <--- [ postgres ]
                             Broker       Main DB (Supabase)
                               ^
                               |
                        [ Celery Worker ]
```

---

## 1. Relational Database Setup (Supabase / Neon)

Create a PostgreSQL instance on Supabase or Neon.
Run migrations using Alembic from the `apps/api-gateway` folder:

```bash
# Configure connection string to production DB
$env:DATABASE_URL="postgresql+asyncpg://prod_user:password@db-host:5432/prod_db"

# Execute Alembic upgrade to apply schemas
python -m alembic upgrade head
```

---

## 2. Ephemeral Storage & Broker Setup (Upstash Redis)

Create a Redis instance on Upstash or Redis Labs.
Set connection URL:
```env
REDIS_URL="redis://default:token@redis-host:6379/0"
```

---

## 3. Backend Deployment (Railway / Render / AWS)

Deploy the `api-gateway` Docker context using Railway or AWS ECS.

**Configuration Variables Required:**
- `ENVIRONMENT=production`
- `DEBUG=false`
- `DATABASE_URL` (async connection schema)
- `REDIS_URL`
- `JWT_SECRET_KEY` (secure 64-byte random string)
- `MINIO_ENDPOINT` (or AWS S3 credentials)

---

## 4. Frontend Deployment (Vercel / Netlify)

Deploy `apps/web` to Vercel.

**Steps:**
1. Import the repository in Vercel.
2. Select Root Directory: `apps/web`.
3. Select Framework Preset: `Next.js`.
4. Configure Environment Variables:
   - `NEXT_PUBLIC_API_URL` (points to your backend gateway URL)
5. Deploy.
