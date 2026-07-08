# libs/shared-schemas

This package contains the shared structural data models (Pydantic models, JSON serialization rules, and API definitions) shared by our Python backends and compiled to TypeScript interfaces for our Next.js frontend.

## Core Responsibilities
- **Type Harmonization:** Acts as the source-of-truth mapping data structures between components.
- **Auto-export:** Runs compile scripts to generate type definitions matching API specifications.
