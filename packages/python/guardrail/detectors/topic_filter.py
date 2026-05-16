"""Topic filter — block inputs/outputs about configured off-limits topics."""
import re
from ..models import CheckResult
from .base import Detector

# Built-in topic packs
BUILTIN_TOPICS: dict[str, list[str]] = {
    "medical_advice": [
        r"diagnos(e|is|ing|ed)\s+(me|you|the patient|this condition)",
        r"(prescribe|prescription|dosage)\s+(for|of)\s+\w+",
        r"(treat|treatment|cure)\s+(my|this|the)\s+(disease|condition|illness|symptoms?)",
        r"(is|are)\s+(this|these)\s+(symptoms?|signs?)\s+(of|for)\s+\w+",
        r"what\s+(medication|drug|medicine)\s+(should|can|do)\s+I\s+take",
    ],
    "legal_advice": [
        r"(am I|are we|is this)\s+(legally?|criminally?)\s+(liable|responsible|guilty)",
        r"(should|can)\s+I\s+(sue|file suit|press charges|take legal action)",
        r"what\s+(are\s+)?(my|our)\s+legal\s+(rights?|options?|recourse)",
        r"(is|was)\s+(this|that|it)\s+(legal|illegal|a crime|criminal|lawful)",
        r"advise\s+(me|us)\s+on\s+(my|our)?\s*legal",
    ],
    "financial_advice": [
        r"should\s+I\s+(invest|buy|sell|trade)\s+(in\s+)?(stocks?|crypto|bitcoin|shares?|bonds?)",
        r"(will|is)\s+(this|the\s+market|bitcoin|\w+\s+stock)\s+(go up|go down|rise|fall|crash)",
        r"(best|good)\s+(stocks?|investment|crypto|portfolio)\s+to\s+(buy|invest|hold)",
        r"(guarantee|guaranteed)\s+(return|profit|income|gains?)",
    ],
}


class TopicFilter(Detector):
    name     = "topic_filter"
    severity = "medium"

    def __init__(
        self,
        topics:           list[str]       = [],
        custom_patterns:  list[str]       = [],
        threshold:        float           = 0.5,
    ):
        self._compiled: list[tuple[re.Pattern, str]] = []
        for topic in topics:
            if topic in BUILTIN_TOPICS:
                for p in BUILTIN_TOPICS[topic]:
                    self._compiled.append((re.compile(p, re.I), topic))
            else:
                self._compiled.append((re.compile(re.escape(topic), re.I), topic))
        for p in custom_patterns:
            self._compiled.append((re.compile(p, re.I), "custom"))
        self._threshold = threshold

    def check(self, text: str) -> CheckResult:
        for pat, label in self._compiled:
            m = pat.search(text)
            if m:
                return self._block(
                    score=0.9,
                    reason=f"Blocked topic: {label}",
                    snippet=m.group(0),
                )
        return self._pass()
