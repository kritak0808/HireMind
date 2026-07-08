# apps/agent-orchestrator

This service manages stateful AI agent workflows. It runs **LangGraph** to coordinate multi-agent hiring decisions and features real-time audio pipeline integrations.

## Core Responsibilities
- **Agent Lifecycle Execution:** Controls state updates as a candidate completes resume analysis, technical screening, coding tests, and cultural review.
- **WebRTC voice Processing:** Pipelining audio streams (Whisper -> LangGraph -> Deepgram TTS).
- **Consensus Synthesis:** Orchestrates the final agent review outputting candidate evaluation charts.

## Structural Outline
```
.
├── src/
│   ├── agents/        # Dedicated agents (HR, Sourcing, Technical, Synthesis)
│   ├── graph/         # State graph definitions & transition schemas
│   ├── tools/         # LLM function invocation tools (Qdrant, SQL)
│   └── main.py        # Service engine init
├── Dockerfile
├── requirements.txt
└── pyproject.toml
```
