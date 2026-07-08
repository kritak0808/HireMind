# HireMind AI — API Gateway Production Dockerfile
# Builds the FastAPI backend for Railway deployment.
# Uses python:3.12-slim for smaller image size with native dependency support.

FROM python:3.12-slim

WORKDIR /app

# Install native build dependencies for asyncpg, psycopg2, etc.
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    libffi-dev \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy monorepo dependency files
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire monorepo (libs + apps)
COPY . .

# Set PYTHONPATH so libs/*/src packages are importable
ENV PYTHONPATH="/app/libs/config/src:/app/libs/telemetry/src:/app/libs/security/src:/app/libs/auth/src:/app/libs/db-core/src:/app/libs/shared-schemas/src:/app/libs/events/src:/app/apps/api-gateway/src:/app/libs"

EXPOSE 8000

# Use $PORT for Railway compatibility — Railway injects $PORT dynamically
CMD ["sh", "-c", "uvicorn main:app --app-dir apps/api-gateway/src --host 0.0.0.0 --port ${PORT:-8000}"]
