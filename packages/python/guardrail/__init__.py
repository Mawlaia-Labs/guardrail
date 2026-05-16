"""guardrail — runtime safety proxy for LLM applications."""

from .models   import CheckResult, ScanResult, AuditEntry, Severity
from .scanner  import Scanner
from .audit    import AuditLog
from .policy   import Policy, PolicyConfig, DEFAULT_POLICY
from .proxy    import SafeOpenAI, GuardrailError
from .detectors import (
    Detector,
    PromptInjectionDetector,
    JailbreakDetector,
    PIIOutputDetector,
    TopicFilter,
    HarmfulContentDetector,
    BUILTIN_TOPICS,
)

__version__ = "0.1.0"

__all__ = [
    "CheckResult", "ScanResult", "AuditEntry", "Severity",
    "Scanner", "AuditLog",
    "Policy", "PolicyConfig", "DEFAULT_POLICY",
    "SafeOpenAI", "GuardrailError",
    "Detector", "PromptInjectionDetector", "JailbreakDetector",
    "PIIOutputDetector", "TopicFilter", "HarmfulContentDetector", "BUILTIN_TOPICS",
]
