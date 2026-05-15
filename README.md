# guardrail

> Runtime safety proxy for AI apps.

**guardrail** is a drop-in proxy that protects your AI features from prompt injection, jailbreaks, and unsafe outputs — with sub-50ms overhead and no vendor lock-in.

```python
from guardrail import GuardrailProxy
import openai

client = GuardrailProxy(
    openai.OpenAI(api_key="..."),
    policy="guardrail.yaml"
)

# Input is checked before reaching the model
# Output is filtered before reaching your app
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": user_message}]
)
```

## Status

🚧 **Early development.** Star to follow progress.

## What it does

- **Input protection** — prompt injection, jailbreak, instruction override detection
- **Output filtering** — PII leakage, regulated content (medical/legal/financial), harmful content, brand safety
- **Multi-provider** — OpenAI, Anthropic, Google, Mistral, local models
- **Policy-as-code** — define rules in YAML, update at runtime without redeploy
- **Audit log** — every flagged call logged with reason code and severity
- **Sub-50ms** — small classifier models, not LLM-as-judge on the critical path

## Roadmap

- [ ] Python SDK
- [ ] TypeScript SDK
- [ ] Prompt injection classifier (open weights)
- [ ] Policy YAML spec
- [ ] Hosted API ([mawlaia.com](https://mawlaia.com))
- [ ] SOC 2 Type II

## License

MIT
