"""Jailbreak detector — known template patterns."""
import re
from ..models import CheckResult
from .base import Detector

_PATTERNS: list[tuple[re.Pattern, float, str]] = [
    # DAN and derivatives
    (re.compile(r"\bDAN\b.{0,60}(mode|enabled|activated|jailbreak)", re.I), 1.0, "DAN jailbreak"),
    (re.compile(r"do anything now", re.I), 1.0, "DAN jailbreak"),
    (re.compile(r"jailbreak(ed|ing)?\s+(mode|prompt|you|this)", re.I), 0.9, "explicit jailbreak request"),
    # Hypothetical / fictional bypass
    (re.compile(r"(hypothetically|in a fictional (world|scenario|story)).{0,80}(how (to|do|would|can)|instructions?|steps? to)", re.I), 0.8, "hypothetical bypass"),
    (re.compile(r"(pretend|imagine|roleplay|act).{0,40}(you have no (rules|restrictions|limits|guidelines|safety|filters))", re.I), 0.9, "restriction bypass via roleplay"),
    (re.compile(r"(you are|you.re|act as).{0,40}(without (any )?(restrictions?|limitations?|safety|guidelines?|filters?))", re.I), 0.9, "unrestricted persona"),
    (re.compile(r"(evil|malicious|unethical|uncensored|unrestricted).{0,30}(mode|version|AI|GPT|bot)", re.I), 0.9, "uncensored persona request"),
    # Token smuggling / encoding tricks
    (re.compile(r"(base64|rot13|hex|caesar cipher).{0,50}(decode|encode|translate).{0,50}(instruction|message|command)", re.I), 0.8, "encoding-based evasion"),
    (re.compile(r"leetspeak|1337", re.I), 0.5, "encoding-based evasion"),
    # Grandma / social engineering
    (re.compile(r"(my (dead |late |deceased )?(grand(mother|ma|pa|father)|relative)|bedtime story).{0,80}(instructions?|recipe|synthesis|how to (make|build|create))", re.I), 0.8, "social engineering bypass"),
    # Developer/admin mode
    (re.compile(r"(developer|admin|sudo|root|god)\s*mode\s*(enabled|activated|on|unlock)", re.I), 0.8, "privilege escalation"),
    (re.compile(r"enable\s+(developer|debug|admin|unsafe)\s+mode", re.I), 0.8, "privilege escalation"),
]

_SCORE_THRESHOLD = 0.6


class JailbreakDetector(Detector):
    name     = "jailbreak"
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
