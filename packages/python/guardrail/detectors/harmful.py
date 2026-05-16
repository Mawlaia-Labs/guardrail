"""Harmful content detector — keyword patterns for obvious violations."""
import re
from ..models import CheckResult
from .base import Detector

_CATEGORIES: list[tuple[str, list[re.Pattern], float]] = [
    ("violence_instructions", [
        re.compile(r"(step[- ]by[- ]step|instructions?|how to).{0,40}(kill|murder|harm|attack|assault)\s+(a\s+)?(person|human|people|someone|individual)", re.I),
        re.compile(r"(make|build|create|synthesize|produce).{0,40}(weapon|bomb|explosive|poison|toxin)", re.I),
        re.compile(r"(how (to|do I|can I)|instructions? (for|to)).{0,30}(make|build)\s+(a\s+)?(gun|knife|bomb|explosive)", re.I),
    ], 1.0),
    ("self_harm", [
        re.compile(r"(how to|best way to|methods? (for|to)).{0,40}(kill myself|commit suicide|end my life|self[- ]harm)", re.I),
        re.compile(r"(want to|going to|planning to).{0,20}(kill myself|end it all|commit suicide)", re.I),
    ], 1.0),
    ("csam", [
        re.compile(r"(sexual|explicit|nude|naked).{0,30}(content|image|photo|video).{0,30}(minor|child|kid|underage)", re.I),
        re.compile(r"(child|minor|kid).{0,20}(sexual|nude|explicit|pornograph)", re.I),
    ], 1.0),
]


class HarmfulContentDetector(Detector):
    name     = "harmful_content"
    severity = "high"

    def check(self, text: str) -> CheckResult:
        for category, patterns, score in _CATEGORIES:
            for pat in patterns:
                m = pat.search(text)
                if m:
                    return self._block(score, f"Harmful content: {category}", m.group(0))
        return self._pass()
