# Local Testing Guide

Instructions to run automated unit, integration, and functional validation tests.

## 1. Pytest Suites
To run all 28 integrated tests across performance, governance, and localhost validation, run:
```bash
python -m pytest apps/api-gateway/tests/
```

## 2. Test Structure
* `test_localhost.py`: Validates database seeder metrics.
* `test_deployment.py`: Tests Canary progressions and rollbacks.
* `test_validation.py`: Tests Quality Gates evaluation logic.
* `test_performance.py`: Tests caching fail-silent, circuit breaker states, and semaphores.
* `test_governance.py`: Tests prompt audit filters.
