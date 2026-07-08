# libs/db-core

This shared library encapsulates standard database operations, SQLAlchemy database mappings, connection session pools, and migrations.

## Core Responsibilities
- **Entity Model Definitions:** Declares clean mappings for PostgreSQL database tables (e.g. Users, Applications, Sessions).
- **Session Provisioning:** Exposes thread-safe, asynchronous session hooks for services to query PostgreSQL databases safely.
- **Alembic migrations Orchestration:** Serves as the single repository source for Alembic migration commands.
