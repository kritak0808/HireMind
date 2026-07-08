# Contributing to HireMind AI

We welcome contributions to HireMind AI! To submit pull requests, please follow these guidelines:

## Development Workflow

### 1. Setup Local Environment

Fork the repository on GitHub, clone your fork locally, and initialize typescript packages and python dependencies:

```bash
# Install TypeScript monorepo dependencies
pnpm install

# Run backend setup (make sure Python 3.12 is installed)
pip install -r requirements-dev.txt
```

### 2. Linting & Formatting Check

Before submitting code, ensure that all style, type, and quality checks pass:

- **Typescript Checks**:
  ```bash
  # Lint Next.js frontend
  pnpm lint:web
  
  # Build Next.js frontend to verify compilations
  pnpm build:web
  ```

- **Python Checks**:
  ```bash
  # Run Ruff checker and formatting checks
  python -m ruff check .
  ```

### 3. Run Test Suites

Verify that backend test runs complete successfully:

```bash
# Configure python path and run pytest
$env:PYTHONPATH = "apps/api-gateway/src;libs/config/src;libs/telemetry/src;libs/security/src;libs/auth/src;libs/db-core/src;libs/shared-schemas/src;libs/events/src"
python -m pytest
```

### 4. Conventional Commits

Format all commit messages matching the Conventional Commits structure:
- `feat: [description]` for new features (e.g. `feat: add hybrid candidate ranking`)
- `fix: [description]` for bug fixes (e.g. `fix: resolve jwt expiration bypass`)
- `docs: [description]` for documentation updates
- `refactor: [description]` for architectural improvements
