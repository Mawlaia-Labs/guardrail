import * as fs from "fs";
import { AuditEntry, ScanResult, makeAuditEntry, Direction } from "./models";

export class AuditLog {
  private readonly _path?:   string;
  private readonly _memory: AuditEntry[] = [];

  constructor(path?: string) {
    this._path = path;
  }

  record(entry: AuditEntry): void {
    this._memory.push(entry);
    if (this._path) {
      fs.appendFileSync(this._path, JSON.stringify(entry) + "\n", "utf-8");
    }
  }

  log(direction: Direction, scan: ScanResult, opts: { model?: string; subjectId?: string } = {}): void {
    this.record(makeAuditEntry(direction, scan, opts));
  }

  entries(): AuditEntry[] {
    return [...this._memory];
  }

  flagged(): AuditEntry[] {
    return this._memory.filter((e) => !e.scan.passed);
  }

  static load(path: string): AuditLog {
    const log = new AuditLog(path);
    if (fs.existsSync(path)) {
      const lines = fs.readFileSync(path, "utf-8").split("\n");
      for (const line of lines) {
        if (line.trim()) {
          log["_memory"].push(JSON.parse(line) as AuditEntry);
        }
      }
    }
    return log;
  }
}
