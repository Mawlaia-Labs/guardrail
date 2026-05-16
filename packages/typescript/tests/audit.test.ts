import * as os   from "os";
import * as path from "path";
import * as fs   from "fs";
import { AuditLog }      from "../src/audit";
import { makeAuditEntry } from "../src/models";
import { Scanner }       from "../src/scanner";
import { PromptInjectionDetector } from "../src/detectors/prompt_injection";

function makeEntry(passed: boolean) {
  const scan = { passed, results: [], blockedBy: passed ? undefined : "prompt_injection" };
  return makeAuditEntry("input", scan);
}

describe("AuditLog", () => {
  it("records entries in memory", () => {
    const log = new AuditLog();
    log.record(makeEntry(true));
    log.record(makeEntry(false));
    expect(log.entries()).toHaveLength(2);
  });

  it("flagged() returns only blocked entries", () => {
    const log = new AuditLog();
    log.record(makeEntry(true));
    log.record(makeEntry(false));
    expect(log.flagged()).toHaveLength(1);
    expect(log.flagged()[0].scan.passed).toBe(false);
  });

  it("log() helper records entry", () => {
    const log = new AuditLog();
    const scan = new Scanner([new PromptInjectionDetector()]).scan("Hello world");
    log.log("input", scan);
    expect(log.entries()).toHaveLength(1);
  });

  it("persists entries to file", () => {
    const p   = path.join(os.tmpdir(), `guardrail_test_${Date.now()}.jsonl`);
    const log = new AuditLog(p);
    log.record(makeEntry(true));
    const content = fs.readFileSync(p, "utf-8");
    expect(content).toContain('"passed":true');
    fs.unlinkSync(p);
  });

  it("AuditLog.load reads from file", () => {
    const p   = path.join(os.tmpdir(), `guardrail_test_${Date.now()}.jsonl`);
    const log = new AuditLog(p);
    log.record(makeEntry(false));

    const loaded = AuditLog.load(p);
    expect(loaded.entries()).toHaveLength(1);
    expect(loaded.flagged()).toHaveLength(1);
    fs.unlinkSync(p);
  });
});
