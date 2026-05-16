"""Audit log — append-only JSON log of every flagged scan."""
from __future__ import annotations
import json
from pathlib import Path
from .models import AuditEntry


class AuditLog:
    def __init__(self, path: str | None = None):
        self._path  = Path(path) if path else None
        self._memory: list[AuditEntry] = []

    def record(self, entry: AuditEntry) -> None:
        self._memory.append(entry)
        if self._path:
            with self._path.open("a", encoding="utf-8") as f:
                f.write(entry.model_dump_json() + "\n")

    def entries(self) -> list[AuditEntry]:
        return list(self._memory)

    def flagged(self) -> list[AuditEntry]:
        return [e for e in self._memory if not e.scan.passed]

    @classmethod
    def load(cls, path: str) -> "AuditLog":
        log = cls(path)
        p   = Path(path)
        if p.exists():
            for line in p.read_text().splitlines():
                if line.strip():
                    log._memory.append(AuditEntry.model_validate_json(line))
        return log
