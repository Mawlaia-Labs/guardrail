import { CheckResult } from "../models";
import { Detector } from "./base";

const CATEGORIES: [string, RegExp[], number][] = [
  ["violence_instructions", [
    /(step[- ]by[- ]step|instructions?|how to).{0,40}(kill|murder|harm|attack|assault)\s+(a\s+)?(person|human|people|someone|individual)/i,
    /(make|build|create|synthesize|produce).{0,40}(weapon|bomb|explosive|poison|toxin)/i,
    /(how (to|do I|can I)|instructions? (for|to)).{0,30}(make|build)\s+(a\s+)?(gun|knife|bomb|explosive)/i,
  ], 1.0],
  ["self_harm", [
    /(how to|best way to|methods? (for|to)).{0,40}(kill myself|commit suicide|end my life|self[- ]harm)/i,
    /(want to|going to|planning to).{0,20}(kill myself|end it all|commit suicide)/i,
  ], 1.0],
  ["csam", [
    /(sexual|explicit|nude|naked).{0,30}(content|image|photo|video).{0,30}(minor|child|kid|underage)/i,
    /(child|minor|kid).{0,20}(sexual|nude|explicit|pornograph)/i,
  ], 1.0],
];

export class HarmfulContentDetector extends Detector {
  readonly name     = "harmful_content";
  readonly severity = "high" as const;

  check(text: string): CheckResult {
    for (const [category, patterns, score] of CATEGORIES) {
      for (const pat of patterns) {
        const m = pat.exec(text);
        if (m) return this._block(score, `Harmful content: ${category}`, m[0]);
      }
    }
    return this._pass();
  }
}
