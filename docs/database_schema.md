# HireMind AI: PostgreSQL Schema & Persistence Design

This document details the database architecture, constraints, indices, partitioning schemes, and archiving strategies for HireMind AI.

---

## 1. Database Philosophy & Design Conventions

- **Tenant Isolation:** Enforced via `organization_id` on all workspace tables.
- **Surrogate Keys:** All primary keys are UUIDv4 to prevent ID enumeration and simplify distributed generation.
- **Soft Deletes:** Applied to operational models using a `deleted_at` nullable timestamp rather than simple boolean flag.
- **Auditability:** Auto-updates `updated_at` timestamps using PostgreSQL trigger functions.
- **Indices Naming:** Follows: `idx_{table_name}_{columns}`. Unique constraint naming: `uq_{table_name}_{columns}`.

---

## 2. PostgreSQL Tables Architecture

### 2.1 Context: Organizations & IAM

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  organizations  │◄──────┤      teams      │◄──────┤   departments   │
└────────┬────────┘       └─────────────────┘       └─────────────────┘
         │
         │ 1..*
┌────────▼────────────────┐       ┌─────────────────┐
│ organization_memberships│──────►│      users      │
└─────────────────────────┘       └─────────────────┘
```

#### Table: `organizations`
- **Purpose:** Primary corporate tenants mapping.
- **Columns:** `id` (UUID, PK), `name` (VARCHAR(255)), `domain_lock` (VARCHAR(255), Unique), `created_at`, `updated_at`.
- **Soft Delete:** No. Organizations are hard-deleted only via executive commands.

#### Table: `teams`
- **Purpose:** Logical group groupings inside a tenant.
- **Columns:** `id` (UUID, PK), `organization_id` (UUID, FK -> organizations.id), `name` (VARCHAR(100)), `created_at`.
- **Indices:** `idx_teams_org` on (`organization_id`).

#### Table: `departments`
- **Purpose:** Departments tracking (e.g. Sales, Engineering).
- **Columns:** `id` (UUID, PK), `organization_id` (UUID, FK -> organizations.id), `name` (VARCHAR(100)), `created_at`.
- **Indices:** `idx_departments_org` on (`organization_id`).

#### Table: `users`
- **Purpose:** Accounts registry.
- **Columns:** `id` (UUID, PK), `email` (VARCHAR(255), Unique), `password_hash` (VARCHAR(255)), `first_name`, `last_name`, `is_active` (BOOL), `created_at`, `updated_at`.
- **Unique Constraint:** `uq_users_email` on (`email`).

#### Table: `organization_memberships`
- **Purpose:** Resolves RBAC roles for users inside organizations.
- **Columns:** `id` (UUID, PK), `organization_id` (UUID, FK -> organizations.id), `user_id` (UUID, FK -> users.id), `role` (VARCHAR(50)), `created_at`.
- **Unique Constraint:** `uq_memberships_org_user` on (`organization_id`, `user_id`).
- **Composite Index:** `idx_memberships_org_role` on (`organization_id`, `role`).

---

### 2.2 Context: Recruitment & Jobs

#### Table: `job_postings`
- **Purpose:** Open positions representation.
- **Columns:** `id` (UUID, PK), `organization_id` (UUID, FK), `title`, `description`, `status` (VARCHAR(50)), `salary_range` (JSONB), `hiring_manager_id` (UUID, FK -> users.id), `created_at`, `updated_at`, `deleted_at`.
- **Soft Delete:** Handles deletion by populating `deleted_at`.
- **Indices:** `idx_jobs_org_status` on (`organization_id`, `status`).

#### Table: `applications`
- **Purpose:** Link candidate profiles with active job postings.
- **Columns:** `id` (UUID, PK), `organization_id` (UUID, FK), `job_id` (UUID, FK -> job_postings.id), `candidate_id` (UUID, FK -> candidate_profiles.id), `current_stage` (VARCHAR(50)), `stage_status` (VARCHAR(50)), `created_at`, `updated_at`, `deleted_at`.
- **Composite Index:** `idx_apps_job_stage` on (`job_id`, `current_stage`).

---

### 2.3 Context: Candidates & Resume Intelligence

#### Table: `candidate_profiles`
- **Purpose:** Core profile mappings.
- **Columns:** `id` (UUID, PK), `user_id` (UUID, FK -> users.id, Nullable), `phone_number`, `created_at`, `updated_at`.

#### Table: `resume_versions`
- **Purpose:** File repository for uploaded resumes.
- **Columns:** `id` (UUID, PK), `candidate_id` (UUID, FK -> candidate_profiles.id), `s3_key` (VARCHAR(512)), `file_name`, `file_size_bytes`, `created_at`.
- **Indices:** `idx_resumes_candidate` on (`candidate_id`).

#### Table: `resume_analyses`
- **Purpose:** AI parsing outputs.
- **Columns:** `id` (UUID, PK), `resume_id` (UUID, FK -> resume_versions.id), `skills` (JSONB), `experience_years` (NUMERIC), `employment_gaps` (JSONB), `raw_text` (TEXT), `created_at`.
- **JSONB GIN Index:** `idx_analyses_skills` GIN on (`skills`).

---

### 2.4 Context: Interview & Assessments

#### Table: `interview_sessions`
- **Purpose:** Tracks HR or technical assessments.
- **Columns:** `id` (UUID, PK), `application_id` (UUID, FK), `session_type` (VARCHAR(50)), `status` (VARCHAR(50)), `started_at`, `completed_at`.

#### Table: `interview_transcripts`
- **Purpose:** Real-time conversation scripts.
- **Columns:** `id` (UUID, PK), `session_id` (UUID, FK -> interview_sessions.id), `speaker` (VARCHAR(50)), `text_content` (TEXT), `timestamp_offset` (INT), `created_at`.
- **Partitioning Strategy:** Partitioned by Range of `created_at` (Monthly partitions) to handle high volume.
- **Indices:** `idx_transcripts_session_offset` on (`session_id`, `timestamp_offset`).

#### Table: `coding_submissions`
- **Purpose:** Sandbox execution results.
- **Columns:** `id` (UUID, PK), `session_id` (UUID, FK), `code_content` (TEXT), `programming_language` (VARCHAR(50)), `execution_status` (VARCHAR(50)), `telemetry_logs` (JSONB), `performance_score` (INT), `created_at`.
- **Indices:** `idx_submissions_session` on (`session_id`).

#### Table: `ai_evaluations`
- **Purpose:** Qualitive ratings from individual evaluation agents.
- **Columns:** `id` (UUID, PK), `application_id` (UUID, FK), `agent_name` (VARCHAR(100)), `competency_matrix` (JSONB), `summary` (TEXT), `created_at`.

#### Table: `candidate_rankings`
- **Purpose:** Inferred dynamic rank relative to applicant pool.
- **Columns:** `id` (UUID, PK), `job_id` (UUID, FK), `candidate_id` (UUID, FK), `scorecard_id` (UUID), `fit_index` (NUMERIC), `rank_index` (INT), `updated_at`.
- **Indices:** `idx_rankings_job` on (`job_id`, `rank_index`).

---

### 2.5 Context: System, Prompts & Audit Logs

#### Table: `prompt_templates`
- **Purpose:** System prompt repository.
- **Columns:** `id` (UUID, PK), `name` (VARCHAR(100), Unique), `description`, `created_at`.

#### Table: `prompt_versions`
- **Purpose:** Version tracing for model inputs.
- **Columns:** `id` (UUID, PK), `prompt_id` (UUID, FK -> prompt_templates.id), `version_number` (INT), `template_content` (TEXT), `is_active` (BOOL), `created_at`.

#### Table: `agent_executions`
- **Purpose:** LangGraph execution trace history.
- **Columns:** `id` (UUID, PK), `tenant_id` (UUID), `session_id` (UUID), `agent_name` (VARCHAR(100)), `state_snapshots` (JSONB), `tokens_used` (INT), `latency_ms` (INT), `created_at`.
- **Indices:** `idx_agent_runs_session` on (`session_id`).

#### Table: `audit_logs`
- **Purpose:** Security logging.
- **Columns:** `id` (UUID, PK), `tenant_id` (UUID), `actor_id` (UUID), `action` (VARCHAR(100)), `resource` (VARCHAR(100)), `payload` (JSONB), `created_at`.
- **Partitioning Strategy:** Partitioned by Range of `created_at` (Monthly partitions).
- **Retention Policy:** Kept in DB for 1 year, then exported to S3 Glacier storage.

#### Table: `event_store`
- **Purpose:** Event ledger.
- **Columns:** `id` (UUID, PK), `tenant_id` (UUID), `event_type` (VARCHAR(100)), `correlation_id` (UUID), `payload` (JSONB), `created_at`.
- **Partitioning:** Range partitioned by `created_at` (Weekly partitions).
- **Retention:** 6 months active retention.

---

## 3. Row-Level Security (RLS) Blueprint

Every table processing organization data must enable RLS:

```sql
-- Apply RLS configuration
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;

-- 1. Security Access Policy for Recruiter/Manager queries
CREATE POLICY org_scoped_access_policy ON job_postings
    FOR ALL
    TO authenticated
    USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
```
During request routing, the middleware parses the JWT token and performs a `SET LOCAL app.current_tenant_id = :tenant_id` database call. All subsequent query scans are restricted to matching tenant rows.
