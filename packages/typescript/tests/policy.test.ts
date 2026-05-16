import { Policy } from "../src/policy";
import { PromptInjectionDetector } from "../src/detectors/prompt_injection";
import { PIIOutputDetector }       from "../src/detectors/pii_output";
import { TopicFilter }             from "../src/detectors/topic_filter";

describe("Policy", () => {
  it("default input detectors include prompt_injection, jailbreak, harmful_content", () => {
    const p      = new Policy();
    const names  = p.inputDetectors().map((d) => d.name);
    expect(names).toContain("prompt_injection");
    expect(names).toContain("jailbreak");
    expect(names).toContain("harmful_content");
  });

  it("default output detectors include pii_output and harmful_content", () => {
    const p     = new Policy();
    const names = p.outputDetectors().map((d) => d.name);
    expect(names).toContain("pii_output");
    expect(names).toContain("harmful_content");
  });

  it("adds TopicFilter when blockedTopics configured", () => {
    const p     = new Policy({ blockedTopics: ["medical_advice"] });
    const names = p.inputDetectors().map((d) => d.name);
    expect(names).toContain("topic_filter");
  });

  it("adds TopicFilter when customPatterns configured", () => {
    const p     = new Policy({ customPatterns: ["secret_pattern"] });
    const names = p.outputDetectors().map((d) => d.name);
    expect(names).toContain("topic_filter");
  });

  it("fromObject creates policy from plain object", () => {
    const p     = Policy.fromObject({ inputDetectors: ["prompt_injection"] });
    const names = p.inputDetectors().map((d) => d.name);
    expect(names).toContain("prompt_injection");
    expect(names).not.toContain("jailbreak");
  });
});
