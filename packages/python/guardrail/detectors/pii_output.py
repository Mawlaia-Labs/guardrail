"""Output PII scanner — detect PII leaking in LLM responses."""
import re
from ..models import CheckResult
from .base import Detector

_PATTERNS: list[tuple[re.Pattern, str]] = [
    (re.compile(r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b"), "email"),
    (re.compile(r"\b(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)(\d{3}[-.\s]?\d{4})\b"), "phone"),
    (re.compile(r"\b\d{3}-\d{2}-\d{4}\b"), "SSN"),
    (re.compile(r"\b4[0-9]{12}(?:[0-9]{3})?\b|\b5[1-5][0-9]{14}\b|\b3[47][0-9]{13}\b"), "credit card"),
    (re.compile(r"\b(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b"), "IP address"),
]


class PIIOutputDetector(Detector):
    name     = "pii_output"
    severity = "high"

    def __init__(self, entity_types: list[str] | None = None):
        # If specified, only flag these entity types
        self._allowed = set(entity_types) if entity_types else None

    def check(self, text: str) -> CheckResult:
        found: list[str] = []
        for pat, label in _PATTERNS:
            if self._allowed and label not in self._allowed:
                continue
            if pat.search(text):
                found.append(label)
        if found:
            return self._block(
                score=1.0,
                reason=f"PII detected in output: {', '.join(found)}",
                snippet=text[:200],
            )
        return self._pass()
