# HireMind AI — Future Product Roadmap

This document outlines the planned future enhancements and milestones for the HireMind AI platform.

## Phase 1: Real-time Audio Pipeline Enhancements (Q3 2026)
- **Deepgram WebRTC integration:** Transition from polling-based audio transcription to full duplex audio streaming.
- **Latency Optimization:** Implement voice activity detection (VAD) models locally in Javascript to minimize audio ingestion lag.
- **Multi-language Support:** Add support for Whisper multi-language models to facilitate global recruiting.

## Phase 2: Hybrid Semantic Vector Search (Q4 2026)
- **Qdrant Indexing:** Transition from simple SQL text filters to hybrid vector search (dense embeddings + BM25 keyword matching) using Qdrant.
- **Custom Candidate Embeddings:** Train custom model adapters to capture domain-specific software engineering skills.
- **Semantic Filtering:** Enable recruiters to type natural queries like *"candidates with database scaling experience in python"* and rank matching profiles.

## Phase 3: Developer Sandbox Enhancements (Q1 2027)
- **Isolate Code Executions:** Replace the mock compiler sandbox with gRPC calls to isolated micro-vms (using Firecracker or secure Docker containers).
- **Expanded Coding Languages:** Add compiler runners for Python 3.12, Golang, and Rust.
- **Plagiarism Expansion:** Implement MOSS-like AST (Abstract Syntax Tree) comparisons to detect high-similarity submissions.

## Phase 4: Advanced AI Governance & Compliance (Q2 2027)
- **Explainable Bias Mitigation:** Implement audit rules showing how LLM evaluation scores are weighted to prevent candidate discrimination.
- **Automatic GDPR Compliance:** Build automated pipelines to erase candidate information upon request ("right to be forgotten").
- **Extended Observability:** Integrate full OpenTelemetry tracing spans from the Next.js gateway all the way to Celery background task workers.
