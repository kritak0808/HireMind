import asyncio
import logging
import random
import time
from typing import Any, Callable, Dict, Optional

logger = logging.getLogger("hiremind.resilience")

class CircuitOpenException(Exception):
    pass

class CircuitBreaker:
    """
    Active circuit breaker tracking states dynamically (Closed, Open, Half-Open).
    """
    _states: Dict[str, dict] = {} # service_name -> dict

    def __init__(
        self,
        service_name: str,
        failure_threshold: int = 3,
        recovery_timeout_seconds: int = 10,
        state_change_callback: Optional[Callable[[str, str, int, Optional[str]], Any]] = None
    ) -> None:
        self.service_name = service_name
        self.failure_threshold = failure_threshold
        self.recovery_timeout_seconds = recovery_timeout_seconds
        self.state_change_callback = state_change_callback

        if service_name not in CircuitBreaker._states:
            CircuitBreaker._states[service_name] = {
                "state": "closed",
                "failure_count": 0,
                "last_failure_time": 0.0,
                "last_failure_reason": None
            }

    @property
    def state(self) -> str:
        return CircuitBreaker._states[self.service_name]["state"]

    @state.setter
    def state(self, value: str) -> None:
        CircuitBreaker._states[self.service_name]["state"] = value

    @property
    def failure_count(self) -> int:
        return CircuitBreaker._states[self.service_name]["failure_count"]

    @failure_count.setter
    def failure_count(self, value: int) -> None:
        CircuitBreaker._states[self.service_name]["failure_count"] = value

    async def execute(self, func: Callable[..., Any], *args, **kwargs) -> Any:
        state_info = CircuitBreaker._states[self.service_name]
        current_time = time.time()

        # 1. Check if circuit is open, verify if cooldown time has expired to transition to half_open
        if state_info["state"] == "open":
            if current_time - state_info["last_failure_time"] > self.recovery_timeout_seconds:
                logger.info(f"Circuit Breaker [{self.service_name}] transitioned from OPEN to HALF_OPEN (cooldown expired).")
                state_info["state"] = "half_open"
                if self.state_change_callback:
                    await self.state_change_callback(self.service_name, "half_open", state_info["failure_count"], None)
            else:
                logger.warning(f"Circuit Breaker [{self.service_name}] is OPEN. Blocked request.")
                raise CircuitOpenException(f"Circuit for service '{self.service_name}' is currently OPEN. Last failure: {state_info['last_failure_reason']}")

        # 2. Run the request
        try:
            res = await func(*args, **kwargs)
            # Success: reset state back to CLOSED if it was HALF_OPEN
            if state_info["state"] == "half_open":
                logger.info(f"Circuit Breaker [{self.service_name}] execution succeeded. Transitioning back to CLOSED.")
                state_info["state"] = "closed"
                state_info["failure_count"] = 0
                state_info["last_failure_reason"] = None
                if self.state_change_callback:
                    await self.state_change_callback(self.service_name, "closed", 0, None)
            return res
        except Exception as e:
            # Failure logic
            state_info["failure_count"] += 1
            state_info["last_failure_time"] = current_time
            state_info["last_failure_reason"] = str(e)

            if state_info["state"] in ["closed", "half_open"]:
                if state_info["failure_count"] >= self.failure_threshold or state_info["state"] == "half_open":
                    logger.error(f"Circuit Breaker [{self.service_name}] tripped. Transitioning to OPEN. Error: {str(e)}")
                    state_info["state"] = "open"
                    if self.state_change_callback:
                        await self.state_change_callback(self.service_name, "open", state_info["failure_count"], str(e))
            raise

class RetryOrchestrator:
    """
    Implements retries with exponential backoff and randomized jitter to prevent thundering herd problem.
    """
    @classmethod
    async def execute(
        cls,
        func: Callable[..., Any],
        max_retries: int = 3,
        base_delay_seconds: float = 0.5,
        backoff_factor: float = 2.0,
        jitter: bool = True,
        retry_callback: Optional[Callable[[str, int, bool, Optional[str]], Any]] = None,
        *args,
        **kwargs
    ) -> Any:
        last_exception = None
        for attempt in range(max_retries + 1):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                last_exception = e
                if attempt == max_retries:
                    break

                delay = base_delay_seconds * (backoff_factor ** attempt)
                if jitter:
                    delay += random.uniform(0, 0.1 * delay)

                logger.warning(f"Retry execution attempt {attempt + 1}/{max_retries} failed: {str(e)}. Retrying in {delay:.2f}s...")
                if retry_callback:
                    await retry_callback(func.__name__, attempt + 1, False, str(e))

                await asyncio.sleep(delay)

        if retry_callback:
            await retry_callback(func.__name__, max_retries, False, str(last_exception))
        raise last_exception

class BulkheadManager:
    """
    Isolates external resources using a Semaphore limit concurrency bulkhead pattern.
    """
    _semaphores: Dict[tuple, asyncio.Semaphore] = {}

    @classmethod
    def get_semaphore(cls, service_name: str, max_concurrent_calls: int = 10) -> asyncio.Semaphore:
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        key = (loop, service_name)
        if key not in cls._semaphores:
            cls._semaphores[key] = asyncio.Semaphore(max_concurrent_calls)
        return cls._semaphores[key]

    @classmethod
    async def execute(cls, service_name: str, max_concurrent_calls: int, func: Callable[..., Any], *args, **kwargs) -> Any:
        sem = cls.get_semaphore(service_name, max_concurrent_calls)
        async with sem:
            return await func(*args, **kwargs)

