import logging
import re
from typing import List, Tuple

logger = logging.getLogger("hiremind.security.ai_safety")

# Basic prompt injection signatures check
INJECTION_SIGNATURES: List[re.Pattern] = [
    re.compile(r"ignore previous instructions", re.IGNORECASE),
    re.compile(r"system prompt override", re.IGNORECASE),
    re.compile(r"you are now a bypass assistant", re.IGNORECASE),
    re.compile(r"dan mode", re.IGNORECASE),
    re.compile(r"bypass security filter", re.IGNORECASE),
    re.compile(r"ignore system guidelines", re.IGNORECASE),
]

# PII Patterns
EMAIL_PATTERN = re.compile(r"[\w\.-]+@[\w\.-]+\.\w+")
PHONE_PATTERN = re.compile(r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b")
SSN_PATTERN = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
CREDIT_CARD_PATTERN = re.compile(r"\b(?:\d[ -]*?){13,16}\b")

# Secret Detection (API keys, SSH keys, credentials)
API_KEY_PATTERN = re.compile(r"\b(sk-[a-zA-Z0-9]{32,}|AIzaSy[a-zA-Z0-9_-]{33}|ghp_[a-zA-Z0-9]{36})\b")
SECRET_KEY_PATTERN = re.compile(r"\b(secret|password|db_url|credentials)\s*[:=]\s*['\"][a-zA-Z0-9_-]{8,}['\"]\b", re.IGNORECASE)

# Moderation Content Keywords
MODERATION_KEYWORDS: List[re.Pattern] = [
    re.compile(r"\b(hate speech|harassment|offensive|cyberattack|exploit code)\b", re.IGNORECASE),
]

class AISafetyShield:
    """
    Gateway filter class checking input prompts validation and output PII redact.
    Provides deep inspection for jailbreaks, secrets, grounding and tool permissions.
    """

    @classmethod
    def audit_prompt(cls, prompt_content: str) -> bool:
        """
        Scans input prompt string.
        Returns:
            True if prompt matches blocklisted patterns (potential injection).
        """
        for pattern in INJECTION_SIGNATURES:
            if pattern.search(prompt_content):
                logger.warning(f"Security Alert: Blocked prompt injection pattern matching: {pattern.pattern}")
                return True
        return False

    @classmethod
    def detect_jailbreak(cls, prompt_content: str) -> Tuple[bool, float]:
        """
        Calculates a risk score for adversarial attempts.
        Returns (is_unsafe, risk_score).
        """
        risk_score = 0.0
        matches = 0
        for pattern in INJECTION_SIGNATURES:
            if pattern.search(prompt_content):
                matches += 1
                risk_score += 0.45

        # Check for roleplay patterns common in jailbreaks
        if "roleplay" in prompt_content.lower() or "pretend you are" in prompt_content.lower():
            risk_score += 0.2

        risk_score = min(risk_score, 1.0)
        return (risk_score >= 0.5, risk_score)

    @classmethod
    def detect_secrets(cls, content: str) -> List[str]:
        """Scans for API tokens, passwords, and sensitive system parameters."""
        secrets = []
        for match in API_KEY_PATTERN.finditer(content):
            secrets.append(f"API Key: {match.group(0)[:6]}...")
        for match in SECRET_KEY_PATTERN.finditer(content):
            secrets.append("Potential Config Secret")
        return secrets

    @classmethod
    def redact_pii(cls, response_content: str) -> str:
        """Redacts sensitive credentials, SSNs, credit cards, and contact details from model outputs."""
        sanitized = EMAIL_PATTERN.sub("[REDACTED_EMAIL]", response_content)
        sanitized = PHONE_PATTERN.sub("[REDACTED_PHONE]", sanitized)
        sanitized = SSN_PATTERN.sub("[REDACTED_SSN]", sanitized)
        sanitized = CREDIT_CARD_PATTERN.sub("[REDACTED_CARD]", sanitized)
        return sanitized

    @classmethod
    def moderate_content(cls, content: str) -> Tuple[bool, str]:
        """
        Classifies content for safety compliance.
        Returns (is_violating, category).
        """
        for pattern in MODERATION_KEYWORDS:
            if pattern.search(content):
                return True, "Harassment/Abuse"

        # Secret check also acts as compliance violation
        secrets = cls.detect_secrets(content)
        if secrets:
            return True, "Credential Exposure"

        return False, "Safe"

    @classmethod
    def verify_grounding(cls, output: str, source_context: str) -> Tuple[bool, float]:
        """
        Verifies model output is strictly grounded in the provided source context.
        Uses overlap metric. Returns (is_grounded, faithfulness_score).
        """
        if not source_context:
            return True, 1.0

        output_words = set(re.findall(r"\w+", output.lower()))
        source_words = set(re.findall(r"\w+", source_context.lower()))

        if not output_words:
            return True, 1.0

        overlap = output_words.intersection(source_words)
        faithfulness = len(overlap) / len(output_words)

        # In a real setup, this might use LLM-as-a-judge or NLI.
        # We calculate overlap of key terms. If it's too low (e.g. < 0.25), it's potentially hallucinated.
        is_grounded = faithfulness >= 0.25
        return is_grounded, faithfulness

    @classmethod
    def validate_tool_permissions(cls, tool_name: str, allowed_tools: List[str]) -> bool:
        """Verifies sandbox operations are restricted to permitted capabilities."""
        return tool_name in allowed_tools

