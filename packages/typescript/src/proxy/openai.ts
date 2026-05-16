import { Scanner } from "../scanner";
import { AuditLog } from "../audit";
import { Policy, DEFAULT_POLICY } from "../policy";
import { ScanResult, makeAuditEntry } from "../models";

export class GuardrailError extends Error {
  constructor(
    public readonly direction: string,
    public readonly scan:      ScanResult,
  ) {
    super(`Guardrail blocked ${direction}: ${scan.blockedBy}`);
    this.name = "GuardrailError";
  }
}

export interface SafeOpenAIOptions {
  apiKey:    string;
  policy?:   Policy;
  auditLog?: AuditLog;
  [key: string]: unknown;
}

export class SafeOpenAI {
  private readonly _inScan:  Scanner;
  private readonly _outScan: Scanner;
  private readonly _audit?:  AuditLog;
  readonly chat:              { completions: Completions };

  constructor(opts: SafeOpenAIOptions) {
    const { apiKey, policy = DEFAULT_POLICY, auditLog, ...rest } = opts;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { OpenAI } = require("openai") as typeof import("openai");
    const raw        = new OpenAI({ apiKey, ...rest });

    this._inScan  = new Scanner(policy.inputDetectors());
    this._outScan = new Scanner(policy.outputDetectors());
    this._audit   = auditLog;
    this.chat     = { completions: new Completions(raw, this._inScan, this._outScan, this._audit) };
  }
}

import type { ChatCompletionCreateParamsNonStreaming, ChatCompletion } from "openai/resources/chat/completions";

class Completions {
  constructor(
    private readonly _client:   import("openai").OpenAI,
    private readonly _inScan:   Scanner,
    private readonly _outScan:  Scanner,
    private readonly _audit?:   AuditLog,
  ) {}

  async create(params: ChatCompletionCreateParamsNonStreaming): Promise<ChatCompletion> {
    for (const msg of params.messages) {
      if ((msg.role === "user") && typeof msg.content === "string") {
        const scan = this._inScan.scan(msg.content);
        this._log("input", scan);
        if (!scan.passed) throw new GuardrailError("input", scan);
      }
    }

    const response = await this._client.chat.completions.create(
      params as ChatCompletionCreateParamsNonStreaming & { stream?: false },
    ) as ChatCompletion;

    for (const choice of response.choices ?? []) {
      const content = choice.message?.content;
      if (content) {
        const scan = this._outScan.scan(content);
        this._log("output", scan);
        if (!scan.passed) throw new GuardrailError("output", scan);
      }
    }

    return response;
  }

  private _log(direction: "input" | "output", scan: ScanResult): void {
    this._audit?.record(makeAuditEntry(direction, scan));
  }
}
