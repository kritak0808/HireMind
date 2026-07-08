# Changelog

All notable changes to the HireMind AI platform will be documented in this file.

## [1.0.0] - 2026-07-04

### Production Release (RC-5)
- **Hardened Security & Core IAM:** Removed cleartext verification prints and plain-text fallback checks. Enforced strict Argon2id hashing algorithms.
- **Demo Data Seeding:** Enabled pre-computed Argon2 hashing for all 1,000 seeded users to ensure instant, secure platform demos.
- **Clean Quality Checks:** Resolved deprecations for `datetime.utcnow()` and `logger.warn` calls.
- **Production Containers:** Formulated multi-stage Dockerfiles and Nginx gateways.
- **Quality Gates:** Fixed unawaited coroutines in database session mock tests.
- **Enterprise CI/CD Pipelines:** Built automated test and lint checks.

### [1.0.0-rc4] - 2026-07-01
- **Product Foundation:** Complete multi-tenant identity architecture, RBAC, ABAC, and MFA.
- **Recruitment Core:** Candidate profiling, resume analytics parser, ranking recommendations, and jobs pipeline.
- **AI Runtime Platform:** LLM orchestrators, prompt versioning systems, caching platforms, and cost trackers.
- **Interview Sandbox:** Live voice/video recordings, real-time transcription, coding playground execution, and recruiter copilot.
- **Executive Analytics:** Enterprise KPI snapshots, budget forecasts, and analytics scenarios simulation.
- **AI Governance:** Experiments manager, prompt safety shield filters, and audit records.
- **Performance & Hardening:** Circuit breakers state controls, exponential backoff jitter retries, resource bulkheads, Redis fail-silent caching, and DB connection pooling metrics.
- **Enterprise QA:** Validation pipelines, quality gate evaluations, WCAG contrast audits, OWASP security scanners, and locked evidence recorders.
- **Production Operations:** Canary deployments orchestration, automatic rollbacks, and active incident response playbooks.
