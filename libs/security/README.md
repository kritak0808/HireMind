# libs/security

This shared package handles identity validation, payload hashing, and cryptographic helper utilities.

## Core Responsibilities
- **Token Cryptography:** Signs and decodes JWT access tokens with robust signature rotation logic.
- **Tenant Scope Assertion:** Verifies credentials to prevent cross-tenant data leaks.
- **Data Encryptors:** Implements fields-level encryption algorithms using AES-256 to safeguard sensitive candidate details (like PII) in the database.
