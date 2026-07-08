# apps/sandbox-executor

This service is a secure, isolated sandbox for building and executing arbitrary code submitted by candidates in the coding arena.

## Core Responsibilities
- **Container Isolation:** Spawns sandboxed, non-networked environments (using gVisor or WebAssembly runtime limits) to run untrusted candidate scripts.
- **Complexity Assessment:** Profiles CPU and memory footprints during candidate tests.
- **Correctness Grading:** Feeds compilation errors, test metrics, and runtime behaviors back to the evaluation queue.

## Structural Outline
```
.
├── src/
│   ├── runtimes/      # Language configuration matrices (Python, Node.js, Go)
│   ├── safety/        # System calls blocker profiles
│   └── runner.py      # Job polling & compilation engine
├── Dockerfile
└── requirements.txt
```
