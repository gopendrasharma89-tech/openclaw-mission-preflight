# Mission Preflight for OpenClaw

Mission Preflight is a native OpenClaw plugin designed for one painful reality: most high-value agent work starts with a vague request.

Instead of jumping straight into execution, this plugin helps the agent do a structured preflight pass first:

- detect ambiguity before wasted work starts
- surface missing constraints and hidden assumptions
- stress-test plans before publishing or shipping
- convert messy notes into execution-ready briefs

## Why this is useful

A lot of agent failures do not happen because the model is weak.
They happen because the task was underspecified.
Mission Preflight creates a practical "clarity layer" before execution.

## Tools included

### 1) mission_preflight_scan
Analyze a raw request and return:
- readiness score
- ambiguity score
- risk score
- contradictions
- missing info
- best next clarification questions
- first safe next action

### 2) mission_preflight_stress_test
Pressure-test a plan or rollout checklist and return:
- likely failure modes
- mitigations
- overall stress level
- verdict

### 3) mission_preflight_brief
Turn messy notes into a structured brief with:
- objective
- deliverable
- constraints
- risks
- acceptance criteria
- open questions
- next steps

## Example use cases

- evaluating startup ideas before execution
- checking if a client brief is actionable
- preparing safer publishing workflows
- turning chat chaos into a clean handoff brief
- stress-testing launch plans before deployment

## Install

```bash
openclaw plugins install openclaw-mission-preflight
```

## Notes

- no API key required
- no external service dependency required
- deterministic and fast
- useful across product, marketing, operations, research, and build workflows
