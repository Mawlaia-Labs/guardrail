import { Detector } from "./detectors/base";
import { ScanResult } from "./models";

export class Scanner {
  private readonly _detectors:    Detector[];
  private readonly _blockOnScore: number;

  constructor(detectors: Detector[], blockOnScore = 0.6) {
    this._detectors    = detectors;
    this._blockOnScore = blockOnScore;
  }

  scan(text: string): ScanResult {
    const results   = this._detectors.map((d) => d.check(text));
    const blockedBy = results.find((r) => !r.passed && r.score >= this._blockOnScore)?.detector;
    return { passed: blockedBy === undefined, results, blockedBy };
  }
}
