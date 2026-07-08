# HireMind AI: Database Migrations, Security & Performance Blueprint

This document details the database migration workflows (Alembic), data performance guidelines, and security compliance strategies for HireMind AI.

---

## 1. Migration Strategy (Alembic)

To keep database updates predictable and zero-downtime ready:
- **Alembic integration:** Configured under `libs/db-core`. Schema changes are declared on SQLAlchemy models, and migration files are auto-generated via target models inspection.
- **Downtime Minimization:** Table modifications (like modifications on high-throughput candidate transcript tables) must occur in non-blocking steps:
  1. Add column as nullable.
  2. Write code writing to both old and new properties.
  3. Backfill data in chunks.
  4. Make column non-nullable (and drop old columns).
- **Naming Conventions:** `[version_id]_[slug].py` (e.g. `2026_07_01_0432_add_candidate_indices.py`).
- **Rollback Routine:** Every migration script must define a clear `downgrade()` implementation to permit quick rollbacks.

---

## 2. Performance Strategy

### 2.1 Indexing Decisions
- **Relational Lookups:** Non-clustered B-Tree indexes are defined on foreign keys (`organization_id`, `job_id`, `candidate_id`) to accelerate join queries.
- **Semantic search optimization:** GIN (Generalized Inverted Index) indices are configured on candidate JSONB arrays (`candidate_profiles(skills)`) to accelerate containment lookups:
  ```sql
  CREATE INDEX idx_candidate_skills_gin ON candidate_profiles USING gin (skills);
  ```

### 2.2 Connection Pooling & Read/Write Separation
- **Pooling parameters:** Commits configure the engine with standard limits: `pool_size=20`, `max_overflow=10`, `pool_pre_ping=True` (to recover dead sockets).
- **Read replicas allocation:** The database adapter layer is structurally prepared to route transactional operations (`INSERT/UPDATE/DELETE`) to primary PostgreSQL instances and query operations (`SELECT`) to read replicas.

### 2.3 Partitioning Guidelines
High-throughput tables (`interview_transcripts`, `audit_logs`, and `event_store`) rely on **Range Partitioning by time (`created_at`)**:
- Partition windows: Monthly for transcripts and audits, weekly for the event store.
- Reduces index sizes, accelerating insertions.

---

## 3. Data-Layer Security & Compliance

### 3.1 Encryption Strategy (Sensitive Column Protection)
- **Hashing credentials:** Passwords must be hashed via bcrypt before saving in database.
- **Encrypt-at-rest:** PII columns (like candidate telephone numbers or email fields) are encrypted using column-level symmetric key routines (AES-256) inside the database adapter before writing, preventing raw visibility inside backups.

### 3.2 GDPR & SOC 2 Compliance
- **Right to be Forgotten:** Database schema is designed with foreign key cascade behaviors (`ON DELETE CASCADE`) to guarantee candidate profiles deletion cascades to matching transcripts, code files, and analysis entries.
- **Audit Trails:** The `audit_logs` record cannot be modified or dropped by organization roles. RLS restricts access to administrators.
