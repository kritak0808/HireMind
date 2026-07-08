# apps/web

This directory contains the **HireMind AI** client-side application built using Next.js 15, React 19, TypeScript, Tailwind CSS v4, Framer Motion, and Zustand.

## Core Responsibilities
- **Recruiter Command Center:** Renders real-time pipelines, evaluation metrics, radar graphs, and dynamic candidate transcripts.
- **Candidate Assessment Portal:** Monaco-based code compiler interface and WebRTC-driven voice call sessions.
- **User Onboarding:** Interactive multi-tenant signup streams.

## Structural Outline
```
.
├── src/
│   ├── app/           # Next.js App Router folders
│   ├── components/    # Reusable visual widgets matching matte-black/gold themes
│   ├── hooks/         # React Query queries & WebRTC audio loop handlers
│   ├── store/         # Zustand slice stores
│   └── styles/        # Global style sheets (Tailwind v4 integrations)
├── package.json
└── tsconfig.json
```
