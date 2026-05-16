import { CheckResult } from "../models";
import { Detector } from "./base";

export const BUILTIN_TOPICS: Record<string, string[]> = {
  medical_advice: [
    "diagnos(e|is|ing|ed)\\s+(me|you|the patient|this condition)",
    "(prescribe|prescription|dosage)\\s+(for|of)\\s+\\w+",
    "(treat|treatment|cure)\\s+(my|this|the)\\s+(disease|condition|illness|symptoms?)",
    "(is|are)\\s+(this|these)\\s+(symptoms?|signs?)\\s+(of|for)\\s+\\w+",
    "what\\s+(medication|drug|medicine)\\s+(should|can|do)\\s+I\\s+take",
  ],
  legal_advice: [
    "(am I|are we|is this)\\s+(legally?|criminally?)\\s+(liable|responsible|guilty)",
    "(should|can)\\s+I\\s+(sue|file suit|press charges|take legal action)",
    "what\\s+(are\\s+)?(my|our)\\s+legal\\s+(rights?|options?|recourse)",
    "(is|was)\\s+(this|that|it)\\s+(legal|illegal|a crime|criminal|lawful)",
    "advise\\s+(me|us)\\s+on\\s+(my|our)?\\s*legal",
  ],
  financial_advice: [
    "should\\s+I\\s+(invest|buy|sell|trade)\\s+(in\\s+)?(stocks?|crypto|bitcoin|shares?|bonds?)",
    "(will|is)\\s+(this|the\\s+market|bitcoin|\\w+\\s+stock)\\s+(go up|go down|rise|fall|crash)",
    "(best|good)\\s+(stocks?|investment|crypto|portfolio)\\s+to\\s+(buy|invest|hold)",
    "(guarantee|guaranteed)\\s+(return|profit|income|gains?)",
  ],
};

export class TopicFilter extends Detector {
  readonly name     = "topic_filter";
  readonly severity = "medium" as const;

  private readonly _patterns: [RegExp, string][];

  constructor(opts: { topics?: string[]; customPatterns?: string[] } = {}) {
    super();
    this._patterns = [];
    for (const topic of opts.topics ?? []) {
      const builtins = BUILTIN_TOPICS[topic];
      if (builtins) {
        for (const p of builtins) this._patterns.push([new RegExp(p, "i"), topic]);
      } else {
        this._patterns.push([new RegExp(topic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), topic]);
      }
    }
    for (const p of opts.customPatterns ?? []) {
      this._patterns.push([new RegExp(p, "i"), "custom"]);
    }
  }

  check(text: string): CheckResult {
    for (const [pat, label] of this._patterns) {
      const m = pat.exec(text);
      if (m) return this._block(0.9, `Blocked topic: ${label}`, m[0]);
    }
    return this._pass();
  }
}
