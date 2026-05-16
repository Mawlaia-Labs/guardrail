from guardrail.audit   import AuditLog
from guardrail.models  import AuditEntry, ScanResult, CheckResult


def _blocked_scan() -> ScanResult:
    return ScanResult(
        passed=False,
        results=[CheckResult(detector="prompt_injection", passed=False, score=1.0, severity="high")],
        blocked_by="prompt_injection",
    )


def _clean_scan() -> ScanResult:
    return ScanResult(passed=True, results=[], blocked_by=None)


def test_audit_in_memory():
    log = AuditLog()
    log.record(AuditEntry(direction="input", scan=_blocked_scan()))
    log.record(AuditEntry(direction="output", scan=_clean_scan()))
    assert len(log.entries()) == 2
    assert len(log.flagged()) == 1


def test_audit_to_file(tmp_path):
    path = str(tmp_path / "audit.jsonl")
    log  = AuditLog(path)
    log.record(AuditEntry(direction="input", scan=_blocked_scan()))
    log.record(AuditEntry(direction="input", scan=_clean_scan()))

    # Reload from file
    log2 = AuditLog.load(path)
    assert len(log2.entries()) == 2
    assert len(log2.flagged()) == 1


def test_audit_entry_has_timestamp():
    entry = AuditEntry(direction="input", scan=_clean_scan())
    assert entry.timestamp != ""
    assert "T" in entry.timestamp  # ISO format


def test_audit_flagged_only_returns_failures():
    log = AuditLog()
    for _ in range(3):
        log.record(AuditEntry(direction="input", scan=_clean_scan()))
    log.record(AuditEntry(direction="input", scan=_blocked_scan()))
    assert len(log.flagged()) == 1
