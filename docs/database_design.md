# HireMind AI: Database Design & Schema Architecture

This document outlines the database design, entity relations, tenant isolation models, indexing strategies, and database schemas for HireMind AI.

---

## 1. Database Paradigm

- **Primary Transactional Store:** PostgreSQL (16+ recommended). Holds application state, user accounts, tenant allocations, pipeline workflows, transcripts, and evaluation parameters.
- **Cache & Event Bus:** Redis (7+). Handles ephemeral cache data, user sessions, socket token registries, Celery broker tasks, and distributed locks.
- **Semantic/Vector Database:** Qdrant. Indexes parsed resumes and jobs to execute vector similarity and k-NN searches.

---

## 2. Multi-Tenancy Strategy (Row-Level Security)

To satisfy enterprise compliance constraints, we use an **isolated row-tenant model** where all workspace tables possess an `organization_id` field. We implement row-level security (RLS) policies at the PostgreSQL engine level.

### 2.1 RLS Setup Flow
1. Disable default table scans by enabling RLS per table.
2. Maintain a session configuration variable representing the currently authenticated user ID (`app.current_user_id`).
3. Define policies checking if the `organization_id` on the target row exists in the user's `organization_memberships` table.

```sql
-- Step 1: Create helper functions to extract session user context
CREATE OR REPLACE FUNCTION auth.current_user_id() 
RETURNS UUID AS $$
    SELECT NULLIF(current_setting('app.current_user_id', true), '')::UUID;
$$ LANGUAGE sql STABLE;

-- Step 2: Establish the Tenant Mapping Check function
CREATE OR REPLACE FUNCTION auth.user_belongs_to_org(org_id UUID) 
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM organization_memberships 
        WHERE user_id = auth.current_user_id() AND organization_id = org_id
    );
$$ LANGUAGE sql STABLE;
```

---

## 3. Entity Relationship Details & Table DDL

Here is the DDL required to configure the database schema (with appropriate indexes).

```sql
-- Enable extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations (Tenants)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain_lock VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_email ON users(email);

-- 3. Organization Memberships (RBAC mapping)
CREATE TABLE organization_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('org_admin', 'recruiter', 'hiring_manager', 'hr_specialist')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, user_id)
);
CREATE INDEX idx_org_mem_user ON organization_memberships(user_id);
CREATE INDEX idx_org_mem_org ON organization_memberships(organization_id);

-- 4. Job Postings
CREATE TABLE job_postings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed', 'archived')),
    hiring_manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_jobs_org ON job_postings(organization_id);
CREATE INDEX idx_jobs_status ON job_postings(status);

-- 5. Candidate Profiles
CREATE TABLE candidate_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    phone_number VARCHAR(50),
    resume_s3_key VARCHAR(512),
    raw_resume_text TEXT,
    skills JSONB DEFAULT '[]'::jsonb, -- Indexed array of skill strings
    experience_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_candidates_skills ON candidate_profiles USING gin (skills);

-- 6. Applications (Tying Candidates to Job Postings)
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    candidate_profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    current_stage VARCHAR(50) NOT NULL CHECK (current_stage IN ('screening', 'technical', 'coding', 'hr', 'synthesis', 'completed', 'rejected')),
    stage_status VARCHAR(50) DEFAULT 'pending' CHECK (stage_status IN ('pending', 'in_progress', 'passed', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_posting_id, candidate_profile_id)
);
CREATE INDEX idx_applications_org ON applications(organization_id);
CREATE INDEX idx_applications_stage ON applications(current_stage);

-- 7. Interview Sessions (Individual stages of an application)
CREATE TABLE interview_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    session_type VARCHAR(50) NOT NULL CHECK (session_type IN ('voice_technical', 'coding_arena', 'voice_hr')),
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'expired')),
    webrtc_room_id VARCHAR(255),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_sessions_app ON interview_sessions(application_id);

-- 8. Transcripts
CREATE TABLE interview_transcripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    speaker VARCHAR(50) NOT NULL CHECK (speaker IN ('candidate', 'agent_interviewer')),
    text_content TEXT NOT NULL,
    timestamp_offset INT NOT NULL, -- Offset in milliseconds from session start
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_transcripts_session ON interview_transcripts(session_id);

-- 9. Coding Arena Submissions
CREATE TABLE coding_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    code_content TEXT NOT NULL,
    programming_language VARCHAR(50) NOT NULL,
    execution_status VARCHAR(50) NOT NULL CHECK (execution_status IN ('success', 'compile_error', 'runtime_error', 'timeout', 'security_violation')),
    telemetry_logs JSONB DEFAULT '{}'::jsonb, -- Detailed stats on tabs switches, typing speed
    performance_score INT CHECK (performance_score >= 0 AND performance_score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_submissions_session ON coding_submissions(session_id);

-- 10. Synthesis & Assessment Reports
CREATE TABLE synthesis_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID UNIQUE NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    overall_score NUMERIC(5, 2) NOT NULL,
    competency_matrix JSONB NOT NULL DEFAULT '{}'::jsonb, -- Skill dimensions scores
    agent_logs JSONB NOT NULL DEFAULT '{}'::jsonb, -- Qualitative review per agent
    s3_report_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. Indexing & Optimization Strategy

1. **Composite Indexes:** Added on frequently queried columns where operations are filtering nested records (e.g. `idx_org_mem_user`, `idx_org_mem_org`).
2. **GIN Indexing:** Employed on `candidate_profiles(skills)` JSONB. This allows the API to perform fast skill extraction queries using the JSONB containment operator (`@>`):
   ```sql
   SELECT * FROM candidate_profiles WHERE skills @> '["Python", "FastAPI"]';
   ```
3. **Partitioning:** For high-throughput tables like `interview_transcripts` and `coding_submissions`, we partition by range of `created_at` in enterprise environments to speed up backups and index rebuilds.
