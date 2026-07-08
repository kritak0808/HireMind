# infrastructure/docker

This directory holds the base docker compose, Dockerfile variants, and environment parameters for local running of services.
- `Dockerfile.api`: Python service runner container blueprints.
- `docker-compose.yml` (located in root): Coordinates postgres database, redis task queues, and qdrant servers locally.
