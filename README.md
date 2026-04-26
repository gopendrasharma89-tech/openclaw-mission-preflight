# Mission Preflight for OpenClaw

> Turn vague requests into execution-ready briefs — before any agent work begins.

[![ClawHub](https://img.shields.io/badge/ClawHub-published-7e22ce)](https://clawhub.ai/plugins/openclaw-mission-preflight)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![OpenClaw](https://img.shields.io/badge/OpenClaw-%E2%89%A52026.4.20-0ea5e9)](https://github.com/openclaw/openclaw)

Most agent failures don't happen because the model is weak. They happen because the **task was underspecified**.

Mission Preflight is a native OpenClaw plugin that adds a *clarity layer* before execution: it scans vague requests for ambiguity, stress-tests plans for failure modes, and converts messy notes into structured briefs.

---

## Why this is unique

ClawHub already has plugins for git workflows, memory, tasks, finance, and security guardrails. None of them fill this specific gap: **catching underspecified work before the agent starts executing**. That's exactly what Mission Preflight does.

- ✅ No API key required
- ✅ No external service dependency
- ✅ Deterministic, fast, offline-friendly
- ✅ Works across product, marketing, ops, research, and build workflows

---

## Install

```bash
openclaw plugins install openclaw-mission-preflight
```

That's it. The agent will see 3 new tools immediately.

---

## Tools

### 1. `mission_preflight_scan`

Analyze a raw request and return:

| Output | What it tells you |
|---|---|
| `readinessScore` | 0–100. Is this request ready to execute? |
| `ambiguityScore` | 0–100. How vague is the request? |
| `riskScore` | 0–100. How risky is the implied work? |
| `missingInfo` | What essential context is missing |
| `contradictions` | Conflicts between scope, timeline, and resources |
| `suggestedQuestions` | Top clarification questions to ask the user |
| `firstSafeAction` | The smallest reversible next step |
| `priorityLane` | Where to focus first |

**Example call:**

```
mission_preflight_scan({
  request: "Build a popular plugin and upload it today",
  strictness: "hard",
  maxQuestions: 5
})
```

**Sample output:**

```
Priority lane: Clarify scope first
Readiness: 11/100 | Ambiguity: 68/100 | Risk: 39/100
Ready to execute: Not yet

Missing info:
- Primary user or audience
- Success metric or acceptance criteria
- Budget or resource limits

Suggested questions:
- Who is the main user, and what pain point should it solve first?
- How will we judge success: downloads, revenue, time saved?
- What budget, resources, or limits should the plan respect?
```

### 2. `mission_preflight_stress_test`

Pressure-test a plan or rollout checklist before execution.

Returns **failure modes**, **mitigations**, **stress level (0–100)**, and a verdict (*Fragile* / *Needs reinforcement* / *Reasonably stable*).

```
mission_preflight_stress_test({
  plan: "1. Build MVP today  2. Publish tonight  3. Launch tomorrow",
  objective: "Ship a viral OpenClaw plugin"
})
```

### 3. `mission_preflight_brief`

Convert messy notes into a compact execution brief.

Returns: **objective, deliverable, constraints, risks, acceptance criteria, open questions, next steps**.

Three output styles: `concise`, `detailed`, `checklist`.

---

## Use cases

- Evaluate startup ideas before you build
- Check if a client brief is actionable
- Prepare safer publishing or deployment workflows
- Turn chat chaos into a clean handoff brief
- Stress-test launch plans before you ship

---

## Configuration

None required. The plugin works out of the box with no environment variables, no auth, no external API.

---

## How it works (under the hood)

The plugin uses deterministic rule-based detection across several signal categories:

- **Ambiguity terms** (asap, soon, best, optimize, somehow…)
- **Big-scope terms** (platform, system, integration…)
- **Deliverable terms** (report, plugin, MVP, dashboard…)
- **Audience terms**, **compliance terms**, **constraint detection**
- **Deadline extraction** via regex
- **Contradiction detection** (scope vs. timeline vs. budget)

Scores are bounded 0–100 and stable across runs. No LLM call is made inside the plugin — it's pure logic, so it's instant and free.

---

## Compatibility

- **OpenClaw:** `>=2026.4.20`
- **Plugin API:** `>=2026.4.20`
- **Plugin SDK:** `2026.4.20`

---

## Links

- 📦 **ClawHub:** https://clawhub.ai/plugins/openclaw-mission-preflight
- 🐙 **GitHub:** https://github.com/gopendrasharma89-tech/openclaw-mission-preflight
- 🐛 **Issues:** https://github.com/gopendrasharma89-tech/openclaw-mission-preflight/issues

## License

MIT — see [LICENSE](./LICENSE).
