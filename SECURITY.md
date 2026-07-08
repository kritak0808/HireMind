# Security Policy

HireMind AI is committed to securing candidate profiles and client organization data. This document outlines our vulnerability management policy, security features, and compliance rules.

## Supported Versions

Only the latest release candidate build is actively supported with security patches:

| Version | Supported |
| ------- | --------- |
| v1.0.x  | Yes       |
| < v1.0  | No        |

## Security Controls

The platform implements the following enterprise-grade security protocols:

1. **Argon2id Hashing:** Password hashing uses Argon2id (via `argon2-cffi` configured with 64MB memory cost, 3 time cost, 4 parallelism threads) to defend against brute-force attacks.
2. **JWT-based Access Tokens:** API endpoints validate authorization headers using HS256 JWT claims with structured Tenant ID mapping.
3. **Multi-Factor Authentication (MFA):** Supports TOTP-based authentication keys (via `pyotp` and QR codes) for elevated privilege routes.
4. **Role-Based Access Control (RBAC):** Restricts data queries based on user roles (`org_admin`, `recruiter`, `hiring_manager`, `candidate`).
5. **AI Safety Shields:** The prompt evaluator scans LLM requests to detect and block prompt injection patterns and toxic signatures.

## Reporting a Vulnerability

Please do not report security vulnerabilities via public GitHub issues. Instead, report security issues privately by emailing **security@hiremind.ai**.

We aim to acknowledge reports within 48 hours and provide a fix resolution within 14 days.
