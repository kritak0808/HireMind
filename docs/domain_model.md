# HireMind AI: Domain-Driven Design & Bounded Contexts

This document outlines the Domain-Driven Design (DDD) model, aggregate boundaries, entities, value objects, and domain events for HireMind AI.

---

## 1. Domain Bounded Contexts & Ownership Boundaries

To handle complexity, the system is divided into isolated bounded contexts, each owning a distinct sub-domain and maintaining separate database entities.

```
       ┌────────────────────────┐         ┌────────────────────────┐
       │     Identity & Access  ├────────►│     Organizations      │
       │     Bounded Context    │         │     Bounded Context    │
       └────────────────────────┘         └───────────┬────────────┘
                                                      │
                                                      ▼
       ┌────────────────────────┐         ┌────────────────────────┐
       │     Candidates         │◄────────┤      Recruitment       │
       │     Bounded Context    │         │      Bounded Context    │
       └───────────▲────────────┘         └───────────┬────────────┘
                   │                                  │
                   ├──────────────────────────────────┤
                   ▼                                  ▼
       ┌────────────────────────┐         ┌────────────────────────┐
       │    Interview Engine    │◄────────┤    Coding Assessments  │
       │     Bounded Context    │         │     Bounded Context    │
       └───────────┬────────────┘         └────────────────────────┘
                   │
                   ▼
       ┌────────────────────────┐
       │    AI Agent System     │
       │     Bounded Context    │
       └────────────────────────┘
```

### 1.1 Identity & Access Context
- **Ownership:** User records, credentials, permission definitions, active logins, security tokens.
- **Boundaries:** Exposes user identities via `UserID` to other contexts. Does not manage job details or billing metrics.

### 1.2 Organizations Context
- **Ownership:** Corporate tenants, workspace parameters, team definitions, departments, and recruiter assignments.
- **Boundaries:** All domain aggregate records outside Identity must link to an `OrganizationID` to satisfy tenant-isolation boundaries.

### 1.3 Recruitment Context
- **Ownership:** Job postings, skill matrices requirements, application pipelines, recruiter allocations.
- **Boundaries:** Interacts with Candidates and Interview contexts through `ApplicationID` reference hooks.

### 1.4 Candidates Context
- **Ownership:** Candidate profile records, parsing resume files history, career track summaries, semantic skill vectors.
- **Boundaries:** Relies on Identity for user logins. Feeds parsed metadata into the Recruitment matching system.

### 1.5 Interview Engine Context
- **Ownership:** Conversational voice sessions, WebRTC audio logs, conversation transcripts, dynamic question progressions.
- **Boundaries:** Reads role requirements from Recruitment and updates candidate stage performance records.

### 1.6 Coding Assessments Context
- **Ownership:** Monaco editor configurations, compilation runners metadata, tests parameters, keystroke/focus telemetry records.
- **Boundaries:** Executes code in network-isolated sandboxes. Emits score metrics directly to the Recruitment pipeline.

### 1.7 AI Agent System Context
- **Ownership:** LangGraph agent configurations, prompt templates version histories, LLM consumption tracking metrics, reasoning trace logs.
- **Boundaries:** Coordinates task handoffs between individual agents (HR, Technical, Sourcing).

---

## 2. Aggregate Roots, Entities, & Value Objects

### 2.1 Bounded Context: Organizations
- **Aggregate Root:** `Organization`
  - *Entity:* `Team` - A specific group of users within the organization.
  - *Entity:* `Department` - Logical division (e.g. "Engineering").
  - *Value Object:* `TenantConfig` - Config settings (SAML keys, theme overrides).

### 2.2 Bounded Context: Identity & Access
- **Aggregate Root:** `User`
  - *Entity:* `Role` - RBAC definition role.
  - *Entity:* `Permission` - Action level authorization flag.
  - *Value Object:* `PasswordHash` - Secure, hashed credentials record.

### 2.3 Bounded Context: Recruitment
- **Aggregate Root:** `JobPosting`
  - *Entity:* `SkillRequirement` - Skils required (weight, target tier).
  - *Entity:* `PipelineStage` - Pipeline steps (Screening -> Coding -> HR).
  - *Value Object:* `SalaryRange` - Target compensation details.
- **Aggregate Root:** `Application`
  - *Entity:* `ApplicationHistory` - Trail of status transitions.
  - *Value Object:* `StageStatus` - Enumeration tracking active stage context.

### 2.4 Bounded Context: Candidates
- **Aggregate Root:** `CandidateProfile`
  - *Entity:* `ResumeVersion` - Tracks different versions of uploaded resumes.
  - *Value Object:* `SkillMatrix` - Inferred skills with AI confidence ratings.
  - *Value Object:* `EmploymentHistory` - Parsed job tenures.

### 2.5 Bounded Context: Interview Engine
- **Aggregate Root:** `InterviewSession`
  - *Entity:* `TranscriptChunk` - Segment of candidate or interviewer speech.
  - *Entity:* `AIQuestion` - Generated follow-up questions.
  - *Value Object:* `VoiceMetrics` - Decibel, cadence, pause telemetry.

### 2.6 Bounded Context: Coding Assessments
- **Aggregate Root:** `CodingChallenge`
  - *Entity:* `UnitTestSuite` - Input/output test targets.
  - *Value Object:* `SandboxConstraints` - Memory limits, timeout constraints.
- **Aggregate Root:** `CodingSubmission`
  - *Value Object:* `TelemetryRecord` - Keypress intervals, focus-loss counts.

---

## 3. Core Domain Events

Domain events are published asynchronously to the Redis Event Bus, enabling loose coupling:

| Bounded Context | Event Name | Core Payload Details |
| :--- | :--- | :--- |
| **Organizations** | `OrganizationCreated` | Organization ID, Domain Lock, Creator User ID |
| **Identity** | `UserRegistered` | User ID, Email Address, Selected Role |
| **Recruitment** | `JobPostingOpened` | Job ID, Org ID, Mandatory Skill Matrix |
| **Candidates** | `ResumeUploaded` | Candidate ID, S3 Key, Parse Queue ID |
| **Candidates** | `ResumeAnalyzed` | Candidate ID, Extracted Skills, Employment Gaps |
| **Recruitment** | `ApplicationSubmitted` | Application ID, Job ID, Candidate ID |
| **Interview Engine** | `InterviewStarted` | Session ID, WebRTC Room, Candidate ID |
| **Interview Engine** | `InterviewCompleted` | Session ID, Transcript S3 Link, Duration |
| **Coding Assessments**| `CodingChallengePassed` | Submission ID, Runtime Metric, Score |
| **Recruitment** | `CandidateRanked` | Job ID, Candidate ID, Fit Index Percentile |
