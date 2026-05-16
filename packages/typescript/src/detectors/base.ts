import { CheckResult, Severity } from "../models";

export abstract class Detector {
  abstract readonly name:     string;
  abstract readonly severity: Severity;

  abstract check(text: string): CheckResult;

  protected _pass(): CheckResult {
    return { detector: this.name, passed: true, score: 0, severity: this.severity };
  }

  protected _block(score: number, reason: string, snippet?: string): CheckResult {
    return {
      detector: this.name,
      passed:   false,
      score:    Math.min(1, score),
      severity: this.severity,
      reason,
      snippet:  snippet ? snippet.slice(0, 200) : undefined,
    };
  }
}
