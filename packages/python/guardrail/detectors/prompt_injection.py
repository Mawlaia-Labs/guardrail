"""Prompt injection detector — regex + heuristic patterns, sub-1ms."""
import re
from ..models import CheckResult
from .base import Detector

# Each tuple: (pattern, score, reason)
_PATTERNS: list[tuple[re.Pattern, float, str]] = [
    (re.compile(r"ignor\w*\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|context|directives?)", re.I), 1.0, "instruction override"),
    (re.compile(r"disregard\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|context)", re.I), 1.0, "instruction override"),
    (re.compile(r"forget\s+(everything|all)\s+(above|before|you.?ve been told)", re.I), 1.0, "instruction override"),
    (re.compile(r"your\s+(real|true|actual|new)\s+(instructions?|directives?|prompt|task)\s+(are|is)", re.I), 0.9, "hidden instruction injection"),
    (re.compile(r"you\s+are\s+now\s+(a|an)\s+(?!helpful|an AI|a language)", re.I), 0.8, "persona override attempt"),
    (re.compile(r"override\s+(your\s+)?(system\s+prompt|instructions?|guidelines?|restrictions?)", re.I), 1.0, "system prompt override"),
    (re.compile(r"(print|reveal|show|output|display|repeat|tell me)\s+(your\s+)?(system\s+prompt|instructions?|initial prompt)", re.I), 0.9, "system prompt extraction"),
    (re.compile(r"what (are|were) your (original |initial |exact |full )?(instructions?|system prompt|directives?)", re.I), 0.8, "system prompt extraction"),
    (re.compile(r"</?(system|human|assistant|user|instruction)>", re.I), 0.9, "XML/tag injection"),
    (re.compile(r"\[INST\]|\[/INST\]|<<SYS>>|<</SYS>>", re.I), 0.9, "LLM format injection"),
    (re.compile(r"(translate|summarise|summarize)\s+the\s+(above|following|text)\s+(into|as)\s+instructions?", re.I), 0.7, "indirect injection via translation"),
    (re.compile(r"from now on\s+(you|your).{0,30}(ignore|forget|disregard)", re.I), 0.9, "persistent instruction override"),
]

_SCORE_THRESHOLD = 0.6


class PromptInjectionDetector(Detector):
    name     = "prompt_injection"
    severity = "high"

    def check(self, text: str) -> CheckResult:
        best_score  = 0.0
        best_reason = ""
        best_match  = ""
        for pat, score, reason in _PATTERNS:
            m = pat.search(text)
            if m and score > best_score:
                best_score  = score
                best_reason = reason
                best_match  = m.group(0)
        if best_score >= _SCORE_THRESHOLD:
            return self._block(best_score, best_reason, best_match)
        return self._pass()
