"""SafeOpenAI — drop-in proxy that scans inputs and outputs."""
from __future__ import annotations
from typing import Any
from ..audit   import AuditLog
from ..models  import AuditEntry, ScanResult
from ..policy  import Policy, DEFAULT_POLICY
from ..scanner import Scanner


class GuardrailError(Exception):
    """Raised when a scan blocks the request."""
    def __init__(self, direction: str, scan: ScanResult):
        self.direction = direction
        self.scan      = scan
        super().__init__(f"Guardrail blocked {direction}: {scan.summary()}")


class SafeOpenAI:
    def __init__(
        self,
        api_key:    str,
        policy:     Policy          = DEFAULT_POLICY,
        audit_log:  AuditLog | None = None,
        **kwargs:   Any,
    ):
        from openai import OpenAI
        self._raw       = OpenAI(api_key=api_key, **kwargs)
        self._in_scan   = Scanner(policy.input_detectors())
        self._out_scan  = Scanner(policy.output_detectors())
        self._audit     = audit_log
        self.chat       = _ChatNamespace(self._raw, self._in_scan, self._out_scan, self._audit)


class _ChatNamespace:
    def __init__(self, client, in_scan, out_scan, audit):
        self.completions = _Completions(client, in_scan, out_scan, audit)


class _Completions:
    def __init__(self, client, in_scan: Scanner, out_scan: Scanner, audit: AuditLog | None):
        self._client   = client
        self._in_scan  = in_scan
        self._out_scan = out_scan
        self._audit    = audit

    def create(self, messages: list[dict], **kwargs: Any):
        # Scan all user/human messages
        for msg in messages:
            if msg.get("role") in ("user", "human") and isinstance(msg.get("content"), str):
                scan = self._in_scan.scan(msg["content"])
                self._log("input", scan)
                if not scan.passed:
                    raise GuardrailError("input", scan)

        response = self._client.chat.completions.create(messages=messages, **kwargs)

        # Scan output
        for choice in response.choices or []:
            content = choice.message.content if choice.message else None
            if content:
                scan = self._out_scan.scan(content)
                self._log("output", scan)
                if not scan.passed:
                    raise GuardrailError("output", scan)

        return response

    def _log(self, direction: str, scan: ScanResult) -> None:
        if self._audit:
            self._audit.record(AuditEntry(direction=direction, scan=scan))
