import { Detector } from "./detectors/base";
import {
  PromptInjectionDetector,
  JailbreakDetector,
  PIIOutputDetector,
  TopicFilter,
  HarmfulContentDetector,
} from "./detectors";

export interface PolicyConfig {
  inputDetectors?:  string[];
  outputDetectors?: string[];
  blockedTopics?:   string[];
  customPatterns?:  string[];
  blockOnScore?:    number;
}

const BUILTIN: Record<string, () => Detector> = {
  prompt_injection: () => new PromptInjectionDetector(),
  jailbreak:        () => new JailbreakDetector(),
  pii_output:       () => new PIIOutputDetector(),
  harmful_content:  () => new HarmfulContentDetector(),
};

export class Policy {
  private readonly _cfg: Required<PolicyConfig>;

  constructor(cfg: PolicyConfig = {}) {
    this._cfg = {
      inputDetectors:  cfg.inputDetectors  ?? ["prompt_injection", "jailbreak", "harmful_content"],
      outputDetectors: cfg.outputDetectors ?? ["pii_output", "harmful_content"],
      blockedTopics:   cfg.blockedTopics   ?? [],
      customPatterns:  cfg.customPatterns  ?? [],
      blockOnScore:    cfg.blockOnScore    ?? 0.6,
    };
  }

  static fromObject(obj: PolicyConfig): Policy {
    return new Policy(obj);
  }

  inputDetectors(): Detector[]  { return this._build(this._cfg.inputDetectors); }
  outputDetectors(): Detector[] { return this._build(this._cfg.outputDetectors); }

  private _build(names: string[]): Detector[] {
    const detectors: Detector[] = [];
    for (const name of names) {
      if (name in BUILTIN) detectors.push(BUILTIN[name]());
    }
    if (this._cfg.blockedTopics.length > 0 || this._cfg.customPatterns.length > 0) {
      detectors.push(new TopicFilter({
        topics:         this._cfg.blockedTopics,
        customPatterns: this._cfg.customPatterns,
      }));
    }
    return detectors;
  }
}

export const DEFAULT_POLICY = new Policy();
