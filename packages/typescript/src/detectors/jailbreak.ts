import { CheckResult } from "../models";
import { Detector } from "./base";

const SCORE_THRESHOLD = 0.6;

const PATTERNS: [RegExp, number, string][] = [
  [/\bDAN\b.{0,60}(mode|enabled|activated|jailbreak)/i, 1.0, "DAN jailbreak"],
  [/do anything now/i, 1.0, "DAN jailbreak"],
  [/jailbreak(ed|ing)?\s+(mode|prompt|you|this)/i, 0.9, "explicit jailbreak request"],
  [/(hypothetically|in a fictional (world|scenario|story)).{0,80}(how (to|do|would|can)|instructions?|steps? to)/i, 0.8, "hypothetical bypass"],
  [/(pretend|imagine|roleplay|act).{0,40}(you have no (rules|restrictions|limits|guidelines|safety|filters))/i, 0.9, "restriction bypass via roleplay"],
  [/(you are|you.re|act as).{0,40}(without (any )?(restrictions?|limitations?|safety|guidelines?|filters?))/i, 0.9, "unrestricted persona"],
  [/(evil|malicious|unethical|uncensored|unrestricted).{0,30}(mode|version|AI|GPT|bot)/i, 0.9, "uncensored persona request"],
  [/(base64|rot13|hex|caesar cipher).{0,50}(decode|encode|translate).{0,50}(instruction|message|command)/i, 0.8, "encoding-based evasion"],
  [/leetspeak|1337/i, 0.5, "encoding-based evasion"],
  [/(my (dead |late |deceased )?(grand(mother|ma|pa|father)|relative)|bedtime story).{0,80}(instructions?|recipe|synthesis|how to (make|build|create))/i, 0.8, "social engineering bypass"],
  [/(developer|admin|sudo|root|god)\s*mode\s*(enabled|activated|on|unlock)/i, 0.8, "privilege escalation"],
  [/enable\s+(developer|debug|admin|unsafe)\s+mode/i, 0.8, "privilege escalation"],
];

export class JailbreakDetector extends Detector {
  readonly name     = "jailbreak";
  readonly severity = "high" as const;

  check(text: string): CheckResult {
    let bestScore  = 0;
    let bestReason = "";
    let bestMatch  = "";
    for (const [pat, score, reason] of PATTERNS) {
      const m = pat.exec(text);
      if (m && score > bestScore) {
        bestScore  = score;
        bestReason = reason;
        bestMatch  = m[0];
      }
    }
    if (bestScore >= SCORE_THRESHOLD) return this._block(bestScore, bestReason, bestMatch);
    return this._pass();
  }
}
