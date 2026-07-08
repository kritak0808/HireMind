# HireMind AI: Engineering Standards & Code Conventions

This document establishes the official coding practices, tooling configurations, security guidelines, and architectural patterns required for the HireMind AI repository.

---

## 1. Directory Modularity & Dependency Flow

- We enforce a **strict Layered Architecture (clean / onion architecture)** inside our services.
- **Dependency Inversion Principle (DIP):** Higher-level domains must not depend on lower-level infrastructure details. Concrete adapters (e.g. databases, external API libraries) must implement abstractions defined in the domain core.
- **Forbidden Import Directions:** 
  - Domain core files *must never* import from router folders, framework files, or database clients.
  - Inter-service imports are disallowed. Shared schemas and utils must be isolated to shared libraries in the `/libs` directory.

---

## 2. Backend Coding Standards (Python & FastAPI)

### 2.1 Code Formatter and Linters
- **Formatter:** `black` (line limit set to `88` characters).
- **Linter:** `ruff` or `flake8` to catch syntactic anomalies and unused imports.
- **Type Checker:** Strict `mypy` typing checks. Dynamic typing (`Any`) is restricted.

### 2.2 SQLAlchemy Session Lifecycle
- Always use the asynchronous SQLAlchemy `AsyncSession` context to prevent execution thread blockages.
- Never write database sessions that span multiple HTTP requests. Sessions must be scoped to a single request lifecycle using FastAPI dependency injection (`Depends`).
- **N+1 Query Prevention:** Always explicitly specify relational load behavior using `joinedload` or `selectinload` when querying relational properties. Lazy load actions are disabled.

```python
# Standard async fetching with relation resolution
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

async def get_job_with_manager(session: AsyncSession, job_id: UUID) -> Optional[JobPosting]:
    stmt = (
        select(JobPosting)
        .options(selectinload(JobPosting.hiring_manager))
        .where(JobPosting.id == job_id)
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()
```

---

## 3. Frontend Coding Standards (TypeScript & Next.js 15 App Router)

### 3.1 Component Partitioning
- **React Server Components (RSC):** Default for all pages, layouts, and static elements. RSCs perform queries directly via repositories and render on the server, minimizing client-side JS bundle sizes.
- **Client Components (`"use client"`):** Restricted to components containing interactivity (e.g. Monaco editor wrappers, canvas animations, WebRTC player buttons, charts, and input forms).

### 3.2 State Modeling in Zustand
- Maintain distinct state domains (e.g. `authStore`, `codingArenaStore`, `voiceCallStore`).
- Always define explicit state interfaces and selectors to limit component re-render loops.

```typescript
// Sample Zustand standard slice pattern
import { create } from 'zustand';

interface TelemetryState {
  tabSwitches: number;
  incrementTabSwitches: () => void;
  resetTelemetry: () => void;
}

export const useTelemetryStore = create<TelemetryState>((set) => ({
  tabSwitches: 0,
  incrementTabSwitches: () => set((state) => ({ tabSwitches: state.tabSwitches + 1 })),
  resetTelemetry: () => set({ tabSwitches: 0 }),
}));
```

### 3.3 Visual & Theme Standards (Tailwind CSS v4)
- HireMind AI implements a luxurious **Executive Intelligence Center** UI theme:
  - **Backgrounds:** Pure matte-black `#0D0D0C` or deeply saturated `#070707`.
  - **Accents:** Muted Gold `#D4AF37` and polished Brass colors.
  - **Borders:** Translucent glassmorphic borders using frosted glass utilities (`backdrop-blur`).
- Standard Tailwind structure must be defined in `apps/web/src/styles/index.css`. Ad-hoc hex colors in styling tags are prohibited.

---

## 4. Security & Compliance Requirements

1. **Input Validation:** All input payloads must be parsed and verified using Pydantic schemas (backend) and Zod schemas (frontend) before processing.
2. **Sandbox Safety:**
   - Any remote evaluation session must execute inside a read-only filesystem environment.
   - Resource limits (memory limits, processor execution restrictions) must be strictly enforced via the Docker daemon or gVisor sandbox.
3. **Data Protection:** Candidate files (resumes, audio recordings) stored in S3-compatible buckets must possess short-lived presigned URLs. Direct URL exposure is forbidden.
4. **GDPR Integrity:** Design code to ensure complete purging of candidate records upon request. Soft-delete columns are not sufficient for right-to-be-forgotten requests.
