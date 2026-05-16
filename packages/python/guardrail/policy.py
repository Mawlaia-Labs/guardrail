"""Policy — load guardrail configuration from YAML or dict."""
from __future__ import annotations
from typing import Any
from pydantic import BaseModel
from .detectors import (
    Detector, PromptInjectionDetector, JailbreakDetector,
    PIIOutputDetector, TopicFilter, HarmfulContentDetector,
)


class PolicyConfig(BaseModel):
    input_detectors:  list[str] = ["prompt_injection", "jailbreak", "harmful_content"]
    output_detectors: list[str] = ["pii_output", "harmful_content"]
    blocked_topics:   list[str] = []
    custom_patterns:  list[str] = []
    block_on_score:   float     = 0.6


_BUILTIN: dict[str, type[Detector]] = {
    "prompt_injection": PromptInjectionDetector,
    "jailbreak":        JailbreakDetector,
    "pii_output":       PIIOutputDetector,
    "harmful_content":  HarmfulContentDetector,
}


class Policy:
    def __init__(self, config: PolicyConfig | None = None):
        self._cfg = config or PolicyConfig()

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "Policy":
        return cls(PolicyConfig(**d))

    @classmethod
    def from_yaml(cls, path: str) -> "Policy":
        import yaml
        with open(path) as f:
            return cls.from_dict(yaml.safe_load(f))

    def input_detectors(self) -> list[Detector]:
        return self._build(self._cfg.input_detectors)

    def output_detectors(self) -> list[Detector]:
        return self._build(self._cfg.output_detectors)

    def _build(self, names: list[str]) -> list[Detector]:
        detectors: list[Detector] = []
        for name in names:
            if name == "topic_filter" or (name not in _BUILTIN and (self._cfg.blocked_topics or self._cfg.custom_patterns)):
                detectors.append(TopicFilter(
                    topics=self._cfg.blocked_topics,
                    custom_patterns=self._cfg.custom_patterns,
                ))
            elif name in _BUILTIN:
                detectors.append(_BUILTIN[name]())
        # Always add topic_filter when blocked_topics/custom_patterns are configured
        if (self._cfg.blocked_topics or self._cfg.custom_patterns) and \
           not any(isinstance(d, TopicFilter) for d in detectors):
            detectors.append(TopicFilter(
                topics=self._cfg.blocked_topics,
                custom_patterns=self._cfg.custom_patterns,
            ))
        return detectors


DEFAULT_POLICY = Policy()
