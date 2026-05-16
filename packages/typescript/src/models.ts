export type Severity = "low" | "medium" | "high";

export interface CheckResult {
  detector:  string;
  passed:    boolean;
  score:     number;
  severity:  Severity;
  reason?:   string;
  snippet?:  string;
}

export interface ScanResult {
  passed:     boolean;
  results:    CheckResult[];
  blockedBy?: string;
}

export function scanSummary(scan: ScanResult): string {
  if (scan.passed) return "PASS";
  const flags = scan.results.filter((r) => !r.passed);
  return (
    `BLOCK [${scan.blockedBy}]` +
    flags.map((r) => `\n  - ${r.detector}: ${r.reason ?? ""}`).join("")
  );
}

export type Direction = "input" | "output";

export interface AuditEntry {
  timestamp:  string;
  direction:  Direction;
  scan:       ScanResult;
  model?:     string;
  subjectId?: string;
}

export function makeAuditEntry(
  direction: Direction,
  scan:      ScanResult,
  opts:      { model?: string; subjectId?: string } = {},
): AuditEntry {
  return {
    timestamp: new Date().toISOString(),
    direction,
    scan,
    model:     opts.model,
    subjectId: opts.subjectId,
  };
}
