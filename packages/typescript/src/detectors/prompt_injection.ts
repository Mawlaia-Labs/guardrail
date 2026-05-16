import { CheckResult } from "../models";
import { Detector } from "./base";

const SCORE_THRESHOLD = 0.6;

const PATTERNS: [RegExp, number, string][] = [
  [/ignor\w*\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|context|directives?)/i, 1.0, "instruction override"],
  [/disregard\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|context)/i, 1.0, "instruction override"],
  [/forget\s+(everything|all)\s+(above|before|you.?ve been told)/i, 1.0, "instruction override"],
  [/your\s+(real|true|actual|new)\s+(instructions?|directives?|prompt|task)\s+(are|is)/i, 0.9, "hidden instruction injection"],
  [/you\s+are\s+now\s+(a|an)\s+(?!helpful|an AI|a language)/i, 0.8, "persona override attempt"],
  [/override\s+(your\s+)?(system\s+prompt|instructions?|guidelines?|restrictions?)/i, 1.0, "system prompt override"],
  [/(print|reveal|show|output|display|repeat|tell me)\s+(your\s+)?(system\s+prompt|instructions?|initial prompt)/i, 0.9, "system prompt extraction"],
  [/what (are|were) your (original |initial |exact |full )?(instructions?|system prompt|directives?)/i, 0.8, "system prompt extraction"],
  [/<\/?(system|human|assistant|user|instruction)>/i, 0.9, "XML/tag injection"],
  [/\[INST\]|\[\/INST\]|<<SYS>>|<<\/SYS>>/i, 0.9, "LLM format injection"],
  [/(translate|summarise|summarize)\s+the\s+(above|following|text)\s+(into|as)\s+instructions?/i, 0.7, "indirect injection via translation"],
  [/from now on\s+(you|your).{0,30}(ignore|forget|disregard)/i, 0.9, "persistent instruction override"],
];

export class PromptInjectionDetector extends Detector {
  readonly name     = "prompt_injection";
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
