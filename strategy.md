# AI Guardrails & Runtime Safety — Strategy & Development Plan

*Opportunity #7 from infrastructure_opportunities.md*
*"The security layer every customer-facing AI feature needs"*

---

## 1. Market Opportunity

### Problem
Every company shipping AI to end users discovers — usually after a public incident — that they need a runtime safety layer. Prompt injection bypasses instructions. Jailbreaks extract confidential system prompts. Users ask for medical/legal/financial advice the company can't provide. LLMs hallucinate and leak internal data in responses. This layer is always needed, never pre-built.

### Market size
- Every customer-facing AI feature is a potential deployment. That's tens of thousands of products today.
- The prompt injection problem alone is OWASP LLM Top 10 #1 — every security review flags it.
- Realistic SOM at 3 years: 500–3000 paying deployments × €300–5000/month = €1.8M–180M ARR.
- Per-request pricing scales with customer growth: as their traffic grows, so does your revenue.

### Forcing functions
- **OWASP LLM Top 10** — prompt injection is #1; every security audit now includes AI
- **EU AI Act** — high-risk systems require documented runtime safety measures (Art. 9, 16, 17)
- **AI incidents** — Air Canada chatbot fiasco, Samsung data leak via ChatGPT, dozens of jailbreak incidents in 2024–2025 that became news stories
- **Cyber insurance** — new policy riders specifically for AI incident coverage, requiring documented safety measures
- **SOC 2 audits** — security reviewers now ask "what prevents prompt injection in your AI features?"
- **Enterprise procurement** — security questionnaires now include AI-specific sections

### Buyer profile
- **Primary:** Head of Security / CISO at an AI-shipping company
- **Secondary:** Head of Engineering (post-incident or pre-launch security review)
- **Tertiary:** ML/AI Lead (needs to implement what security team mandated)
- **Budget:** €500–5000/month self-serve; €20K–100K/year enterprise
- **Sales motion:** bottoms-up (engineer discovers OSS, installs, upgrades) + top-down (CISO mandates)

---

## 2. Competition Landscape

| Player | Positioning | Gap |
|---|---|---|
| **Lakera Guard** | Prompt injection focused, good API | Limited output filtering, narrow scope, no policy DSL, enterprise pricing |
| **Protect AI** | AI security platform, broad | Enterprise-only, complex, not developer-first |
| **Robust Intelligence** | AI risk platform (acquired by Cisco) | Enterprise, slow to buy, now buried in Cisco |
| **Prompt Security** | Israeli startup, enterprise AI security | Enterprise sales motion, not self-serve |
| **Pillar Security** | AI security posture management | Broader scope, less focused on runtime guardrails |
| **Azure Content Safety** | Cloud-provider moderation | Azure lock-in, limited customization, no multi-provider proxy |
| **AWS Guardrails for Bedrock** | Cloud-provider guardrails | Bedrock lock-in only |
| **OpenAI Moderation API** | Content moderation | OpenAI-only, output-only, no input filtering, no policy control |
| **NeMo Guardrails (NVIDIA)** | Open-source guardrails framework | Good OSS but no hosted service, complex setup, Colang DSL learning curve |

### Competitive gap
No product offers: **open-source proxy + prompt injection detection + output safety filtering + multi-provider support + policy DSL + per-request pricing**, with the DX quality of a Stripe or Resend. The market is split between "hard to use enterprise" and "open-source with no hosted product."

### Defensibility
- **Adversarial ML depth:** attack techniques evolve weekly; a specialist team stays ahead of commodity solutions
- **Detection dataset:** every blocked attack improves the classifier — a data flywheel
- **Policy DSL:** once customers define safety policies in your language, migrating is expensive
- **Bundle:** same proxy as PII Vault (#2) — customers who use both have even higher switching cost
- **Certifications:** SOC 2 + ISO 42001 become moats for enterprise deals

---

## 3. Customer Needs Map

### Jobs to be done
1. **"A user extracted our system prompt via prompt injection"** — input filtering, instruction isolation
2. **"Our chatbot gave medical advice it shouldn't"** — output topic filtering, regulated content blocking
3. **"A user jailbroke our assistant to produce harmful content"** — jailbreak detection + blocking
4. **"We're leaking internal data in LLM responses"** — output PII/secrets scanning
5. **"We need to prove to our SOC 2 auditor we have AI security controls"** — audit log, policy documentation
6. **"Our AI keeps going off-topic and we can't control it"** — topic scope enforcement

### Attack taxonomy (what to protect against)
- **Input:** prompt injection, jailbreak, role-play bypass, instruction override, goal hijacking
- **Output:** PII leakage, confidential data exposure, harmful content, regulated advice (medical/legal/financial), hallucination amplification, competitor mentions
- **System:** system prompt extraction, context window stuffing, token smuggling

### Integration points
- Drop-in proxy: replace `openai.chat.completions.create()` with `guardrails.chat()` — same response format
- Middleware: FastAPI/Express middleware for API-level filtering
- LangChain / LlamaIndex callbacks
- Multi-provider: OpenAI, Anthropic, Google, Mistral, local models (Ollama)

### Must-have on day one
- Python and TypeScript SDK
- Prompt injection detection (>95% accuracy on standard benchmarks)
- Jailbreak detection
- Output PII scanning (re-use tokenization from PII Vault if built together)
- Sub-50ms overhead (small classifier models, not LLM-as-judge for latency-critical path)
- Policy definition: YAML or simple DSL for custom rules
- Audit log: every flagged call with reason code
- Free tier: 10K checks/month free

---

## 4. Staged Development Plan

### Phase 0 — Open-source proxy (weeks 1–4)
**Goal:** be the canonical OSS answer for "how to add guardrails to my LLM app"

- [ ] Open-source `guardrail` or `llm-guard` (check naming) monorepo
- [ ] Python SDK: `GuardrailProxy(openai_client)` wrapper — transparent proxy
- [ ] Input detectors: prompt injection (fine-tuned classifier on deberta/bert), jailbreak patterns
- [ ] Output detectors: PII scanning (spaCy NER), basic topic filter, harmful content (small classifier)
- [ ] Policy file: `guardrails.yaml` — define allowed topics, blocked outputs, custom rules
- [ ] Audit log: local JSON log of every flag (timestamp, type, severity, truncated content)
- [ ] Sub-50ms latency target for all detectors (use small models, not GPT-4o)
- [ ] Benchmark publish: accuracy + latency vs Lakera, NeMo Guardrails on public prompt injection datasets
- [ ] Publish: GitHub, HN Show HN, OWASP LLM community

**Success metric:** 400+ GitHub stars, 5 design partner convos, cited in 2+ security blogs

---

### Phase 1 — Hosted version + policy builder (months 1–3)
**Goal:** first paying customers

- [ ] Hosted API: `POST /v1/check/input` and `POST /v1/check/output` — no proxy required
- [ ] Dashboard: flagged calls log, policy editor, per-rule hit rates
- [ ] Visual policy builder: define blocked topics, custom entity types, severity levels
- [ ] Multi-provider proxy: hosted proxy that wraps OpenAI, Anthropic, Google
- [ ] Anthropic + OpenAI SDK compatibility (drop-in replacement)
- [ ] LangChain callback handler
- [ ] Free tier: 10K checks/month
- [ ] Pro tier: €99/month, 100K checks, full audit log, policy API
- [ ] Onboard 5–10 design partners

**Success metric:** 10 paying customers, €1K–3K MRR

---

### Phase 2 — Advanced detection + output safety (months 3–6)
**Goal:** cover enterprise security use cases

- [ ] Hallucination detection: ground output against provided context/knowledge base
- [ ] System prompt extraction detection (meta-prompt attacks)
- [ ] Competitor mention filtering
- [ ] Regulated content: medical advice, legal advice, financial advice detection (jurisdiction-aware)
- [ ] Custom classifier training: fine-tune on customer's own flagged examples
- [ ] Real-time policy updates (no redeploy required)
- [ ] Webhook on flag: send flagged call details to customer's SIEM/Slack/PagerDuty
- [ ] SOC 2 Type I started
- [ ] Bundle with PII Vault: combined proxy, single SDK, shared audit log

**Success metric:** 40–80 paying customers, €8K–15K MRR

---

### Phase 3 — Enterprise + compliance (months 6–12)
**Goal:** win enterprise security deals

- [ ] SOC 2 Type II
- [ ] ISO 42001 alignment documentation
- [ ] On-premise/VPC deployment option (some enterprises won't route traffic through third-party)
- [ ] SIEM integration: Splunk, Datadog, AWS Security Hub
- [ ] Role-based policy management (different guardrail profiles per user role/tier)
- [ ] SLA guarantees (99.9% uptime, <50ms p95 latency)
- [ ] Enterprise tier: €999+/month, custom classifiers, dedicated support, SLA

**Success metric:** 150–300 paying customers, €30–50K MRR, seed raise

---

### Phase 4 — Platform (months 12–24)
**Goal:** become the AI security standard

- [ ] Full bundle with PII Vault (#2) and Eval (#5) — "AI middleware platform"
- [ ] Red team tooling: help customers test their own AI for vulnerabilities
- [ ] Attack dataset: contribute to / maintain public prompt injection benchmark
- [ ] ISO 27001
- [ ] Multi-tenant SaaS guardrail profiles (one customer = many AI products with different policies)
- [ ] Series A raise

---

## 5. Zero-to-revenue path (bootstrap)

**Week 1–4:** publish open-source proxy + benchmarks → security community traction
**Month 2:** hosted API live → convert 5–10 design partners to €99/month
**Month 3:** 15 paying customers, €1.5K MRR → advanced output filtering
**Month 4–5:** 50 customers, €5K MRR → enterprise conversations from CISO pipeline
**Month 6:** €10K MRR → SOC 2 started → seed-raise ready

**Infrastructure cost at €10K MRR:** ~€400–700/month (Fly.io multi-region + classifier model hosting)

---

## 6. Tech stack recommendation

- **Classifier models:** DeBERTa-v3 fine-tuned for prompt injection, small BERT variants for output safety — run on CPU, sub-20ms
- **Proxy:** Cloudflare Workers (edge, sub-10ms routing) or Fly.io (more control)
- **Hosted API:** FastAPI + Postgres
- **Frontend:** Next.js on Vercel
- **SDKs:** Python + TypeScript
- **Model hosting:** BentoML or Modal for classifier inference, or Cloudflare Workers AI for edge inference
- **Benchmark data:** PromptBench, JailbreakBench, OWASP LLM datasets

### Synergy with #2 PII Vault
If building both, the proxy architecture is shared — the same HTTP proxy handles tokenization (PII Vault) and safety checks (Guardrails). Single SDK call, two products billed separately, combined dashboard. This is the strongest near-term bundling path.

---

*Last updated: 2026-05-15*
