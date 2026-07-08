import logging
import math
from typing import Any, Dict, List

logger = logging.getLogger("hiremind.telemetry.ai_metrics")

# Model cost definitions (Input / Output cost per 1M tokens in USD)
MODEL_RATES: Dict[str, Dict[str, float]] = {
    "gpt-4o": {"input": 5.0, "output": 15.0},
    "gemini-1.5-pro": {"input": 3.5, "output": 10.5},
    "claude-3-opus": {"input": 15.0, "output": 75.0},
    "gemini-2.0-flash": {"input": 0.075, "output": 0.3}
}

class AIMetricsTracker:
    """
    Computes runtime execution parameters: token costs, durations, availability, and drift.
    """

    @classmethod
    def calculate_cost(cls, model_name: str, prompt_tokens: int, completion_tokens: int) -> float:
        """
        Calculates total USD token cost.
        """
        rate = MODEL_RATES.get(model_name.lower(), {"input": 0.0, "output": 0.0})
        input_cost = (prompt_tokens / 1_000_000) * rate["input"]
        output_cost = (completion_tokens / 1_000_000) * rate["output"]

        total = input_cost + output_cost
        logger.info(
            f"AI Call Cost Audit: Model {model_name} processed {prompt_tokens} input, {completion_tokens} output. Total cost: ${total:.6f} USD"
        )
        return total

    @classmethod
    def compute_drift_score(cls, baseline_vector: List[float], current_vector: List[float]) -> float:
        """
        Calculates cosine distance drift score between input embedding vector representations.
        Returns drift score between 0.0 (no drift) and 1.0 (maximum drift).
        """
        if not baseline_vector or not current_vector or len(baseline_vector) != len(current_vector):
            return 0.0

        dot_product = sum(a * b for a, b in zip(baseline_vector, current_vector))
        norm_a = math.sqrt(sum(a * a for a in baseline_vector))
        norm_b = math.sqrt(sum(b * b for b in current_vector))

        if norm_a == 0.0 or norm_b == 0.0:
            return 1.0

        cosine_similarity = dot_product / (norm_a * norm_b)
        cosine_distance = 1.0 - cosine_similarity

        # Clip values to ensure floating-point precision issues do not overflow limits
        return max(0.0, min(cosine_distance, 1.0))

    @classmethod
    def calculate_psi_drift(cls, baseline_distribution: List[float], current_distribution: List[float]) -> float:
        """
        Calculates Population Stability Index (PSI) between two probability distributions.
        """
        if len(baseline_distribution) != len(current_distribution):
            return 0.0

        psi = 0.0
        for b, c in zip(baseline_distribution, current_distribution):
            # Avoid division by zero by smoothing
            b = max(b, 0.0001)
            c = max(c, 0.0001)
            psi += (c - b) * math.log(c / b)
        return psi

    @classmethod
    def assess_model_health(cls, latency_history_ms: List[int], total_calls: int, failed_calls: int) -> Dict[str, Any]:
        """
        Calculates latency and error rate metrics.
        """
        if total_calls == 0:
            return {
                "latency_p95_ms": 0.0,
                "error_rate": 0.0,
                "availability": 1.0
            }

        sorted_latencies = sorted(latency_history_ms)
        p95_idx = int(len(sorted_latencies) * 0.95)
        p95_latency = sorted_latencies[p95_idx] if sorted_latencies else 0.0

        error_rate = failed_calls / total_calls
        availability = 1.0 - error_rate

        return {
            "latency_p95_ms": float(p95_latency),
            "error_rate": float(error_rate),
            "availability": float(availability)
        }

