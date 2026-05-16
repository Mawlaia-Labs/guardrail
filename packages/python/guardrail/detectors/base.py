from abc import ABC, abstractmethod
from ..models import CheckResult


class Detector(ABC):
    name:     str = "base"
    severity: str = "medium"

    @abstractmethod
    def check(self, text: str) -> CheckResult:
        ...

    def _pass(self) -> CheckResult:
        return CheckResult(detector=self.name, passed=True, score=0.0, severity=self.severity)

    def _block(self, score: float, reason: str, snippet: str | None = None) -> CheckResult:
        return CheckResult(
            detector=self.name,
            passed=False,
            score=min(1.0, score),
            severity=self.severity,
            reason=reason,
            snippet=snippet[:200] if snippet else None,
        )
