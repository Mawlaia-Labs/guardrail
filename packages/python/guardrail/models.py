from __future__ import annotations
from datetime import datetime, timezone
from typing import Literal
from pydantic import BaseModel

Severity = Literal["low", "medium", "high"]


class CheckResult(BaseModel):
    detector:  str
    passed:    bool
    score:     float = 0.0        # 0.0 = clean, 1.0 = definite violation
    severity:  Severity = "medium"
    reason:    str | None = None
    snippet:   str | None = None  # truncated evidence (max 200 chars)


class ScanResult(BaseModel):
    passed:     bool
    results:    list[CheckResult]
    blocked_by: str | None = None  # name of first blocking detector

    @property
    def flags(self) -> list[CheckResult]:
        return [r for r in self.results if not r.passed]

    def summary(self) -> str:
        if self.passed:
            return "PASS"
        return f"BLOCK [{self.blocked_by}]" + "".join(
            f"\n  - {r.detector}: {r.reason}" for r in self.flags
        )


class AuditEntry(BaseModel):
    timestamp:  str = ""
    direction:  Literal["input", "output"]
    scan:       ScanResult
    model:      str | None = None
    subject_id: str | None = None

    def __init__(self, **data):
        if not data.get("timestamp"):
            data["timestamp"] = datetime.now(timezone.utc).isoformat()
        super().__init__(**data)
