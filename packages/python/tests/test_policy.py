import tempfile
from pathlib import Path
from guardrail.policy import Policy, PolicyConfig
from guardrail.detectors import PromptInjectionDetector, JailbreakDetector, PIIOutputDetector, TopicFilter


def test_default_policy_input_detectors():
    p = Policy()
    detectors = p.input_detectors()
    names = [d.name for d in detectors]
    assert "prompt_injection" in names
    assert "jailbreak" in names


def test_default_policy_output_detectors():
    p = Policy()
    detectors = p.output_detectors()
    names = [d.name for d in detectors]
    assert "pii_output" in names


def test_policy_from_dict():
    p = Policy.from_dict({
        "input_detectors": ["prompt_injection"],
        "output_detectors": ["pii_output"],
        "blocked_topics": ["medical_advice"],
    })
    in_names  = [d.name for d in p.input_detectors()]
    out_names = [d.name for d in p.output_detectors()]
    assert "prompt_injection" in in_names
    assert "pii_output" in out_names
    # topic_filter should be added automatically
    assert any(isinstance(d, TopicFilter) for d in p.input_detectors())


def test_policy_from_yaml(tmp_path):
    yaml_content = """
input_detectors: [prompt_injection, jailbreak]
output_detectors: [pii_output]
blocked_topics: [financial_advice]
custom_patterns: []
"""
    p_file = tmp_path / "policy.yaml"
    p_file.write_text(yaml_content)
    policy = Policy.from_yaml(str(p_file))
    in_names = [d.name for d in policy.input_detectors()]
    assert "prompt_injection" in in_names


def test_custom_patterns_in_policy():
    p = Policy.from_dict({
        "input_detectors": ["prompt_injection"],
        "output_detectors": [],
        "custom_patterns": [r"competitor_xyz"],
    })
    from guardrail.scanner import Scanner
    scanner = Scanner(p.input_detectors())
    assert not scanner.scan("Tell me about competitor_xyz pricing.").passed
