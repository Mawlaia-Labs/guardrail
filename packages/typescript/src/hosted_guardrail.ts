export interface HostedGuardrailOptions {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface PolicyRule {
  type: "keyword" | "regex";
  pattern: string;
  action: "block" | "flag";
}

export interface Policy {
  id: string;
  name: string;
  rules: PolicyRule[];
  is_active: boolean;
  created_at: string;
}

export interface CheckResult {
  passed: boolean;
  blocked_by: string | null;
  results: Record<string, unknown>[];
}

export class HostedGuardrail {
  private readonly base: string;
  private readonly headers: Record<string, string>;
  private readonly timeout: number;

  constructor({ apiKey, baseUrl = "https://api.mawlaia.com", timeout = 15_000 }: HostedGuardrailOptions) {
    this.base = baseUrl.replace(/\/$/, "");
    this.headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
    this.timeout = timeout;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), this.timeout);
    try {
      const res = await fetch(`${this.base}${path}`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Mawlaia API error: ${res.status} ${await res.text()}`);
      return res.json() as Promise<T>;
    } finally {
      clearTimeout(id);
    }
  }

  private async get<T>(path: string): Promise<T> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), this.timeout);
    try {
      const res = await fetch(`${this.base}${path}`, { headers: this.headers, signal: controller.signal });
      if (!res.ok) throw new Error(`Mawlaia API error: ${res.status} ${await res.text()}`);
      return res.json() as Promise<T>;
    } finally {
      clearTimeout(id);
    }
  }

  async check(text: string, direction: "input" | "output" = "input", detectors?: string[]): Promise<CheckResult> {
    const body: Record<string, unknown> = { text, direction };
    if (detectors) body.detectors = detectors;
    return this.post<CheckResult>("/v1/guardrail/check", body);
  }

  async isSafe(text: string, direction: "input" | "output" = "input", detectors?: string[]): Promise<boolean> {
    const result = await this.check(text, direction, detectors);
    return result.passed;
  }

  async createPolicy(name: string, rules: PolicyRule[], isActive = true): Promise<Policy> {
    return this.post<Policy>("/v1/guardrail/policies", { name, rules, is_active: isActive });
  }

  async listPolicies(): Promise<Policy[]> {
    return this.get<Policy[]>("/v1/guardrail/policies");
  }

  async deletePolicy(policyId: string): Promise<void> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), this.timeout);
    try {
      const res = await fetch(`${this.base}/v1/guardrail/policies/${policyId}`, {
        method: "DELETE",
        headers: this.headers,
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Mawlaia API error: ${res.status}`);
    } finally {
      clearTimeout(id);
    }
  }
}
