"""Scanner — orchestrates detectors, returns ScanResult."""
from __future__ import annotations
from .detectors.base import Detector
from .models import ScanResult


class Scanner:
    def __init__(self, detectors: list[Detector], block_on_score: float = 0.6):
        self._detectors      = detectors
        self._block_on_score = block_on_score

    def scan(self, text: str) -> ScanResult:
        results     = [d.check(text) for d in self._detectors]
        blocked_by  = next((r.detector for r in results if not r.passed and r.score >= self._block_on_score), None)
        return ScanResult(
            passed=blocked_by is None,
            results=results,
            blocked_by=blocked_by,
        )
