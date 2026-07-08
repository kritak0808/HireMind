# Frequently Asked Questions (FAQ)

## 1. What is HireMind AI?
HireMind AI is an autonomous hiring intelligence platform designed to streamline hiring workflows. It automates resume parsing, ATS evaluations, coding sandbox assessments, live interview transcripts, and multi-tenant recruiter operations.

## 2. How do I start the platform locally?
You can start the entire local environment by running the local startup script:
```powershell
.\start-local.ps1
```
This initializes the FastAPI backend API on port `8000` and the Next.js frontend on port `3000`.

## 3. How do I log in to the demo environment?
The local seeder initializes the database with demo users. You can log in using:
- **Email:** `user0@hiremind.ai` (up to `user39@hiremind.ai`) or `candidate_0@gmail.com`
- **Password:** `password123` (configured securely via Argon2id)

## 4. Why are there duplicate folders in the codebase?
You may notice junctions like `apps/api_gateway` pointing to `apps/api-gateway`. These are NTFS junctions necessary for Windows environments. They allow Python import namespaces to compile properly (avoiding dashes in directories) without duplicate files or broken relative paths.

## 5. How are background tasks handled?
Long-running workflows like resume ATS analysis are offloaded to **Celery workers** using **Redis** as a task queue and broker.

## 6. How is candidate privacy secured?
Candidate passwords are hashed using the **Argon2id** algorithm. Permissions are enforced using **Role-Based Access Control (RBAC)** policies mapped at the organization level. In addition, an **AI Safety Shield** checks prompt inputs to detect and block prompt injection patterns.
