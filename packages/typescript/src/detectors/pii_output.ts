import { CheckResult } from "../models";
import { Detector } from "./base";

const PATTERNS: [RegExp, string][] = [
  [/\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/, "email"],
  [/\b(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)(\d{3}[-.\s]?\d{4})\b/, "phone"],
  [/\b\d{3}-\d{2}-\d{4}\b/, "SSN"],
  [/\b4[0-9]{12}(?:[0-9]{3})?\b|\b5[1-5][0-9]{14}\b|\b3[47][0-9]{13}\b/, "credit card"],
  [/\b(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/, "IP address"],
];

export class PIIOutputDetector extends Detector {
  readonly name     = "pii_output";
  readonly severity = "high" as const;

  private readonly _allowed: Set<string> | null;

  constructor(entityTypes?: string[]) {
    super();
    this._allowed = entityTypes ? new Set(entityTypes) : null;
  }

  check(text: string): CheckResult {
    const found: string[] = [];
    for (const [pat, label] of PATTERNS) {
      if (this._allowed && !this._allowed.has(label)) continue;
      if (pat.test(text)) found.push(label);
    }
    if (found.length > 0) {
      return this._block(1.0, `PII detected in output: ${found.join(", ")}`, text.slice(0, 200));
    }
    return this._pass();
  }
}
