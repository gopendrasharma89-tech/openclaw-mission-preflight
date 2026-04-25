import { Type } from "@sinclair/typebox";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const AMBIGUOUS_TERMS = [
  "asap",
  "soon",
  "quickly",
  "fast",
  "best",
  "better",
  "optimize",
  "improve",
  "somehow",
  "something",
  "stuff",
  "things",
  "etc",
  "and so on",
  "maybe",
  "probably",
  "kind of",
  "sort of",
  "if possible",
  "when you can"
];

const BIG_SCOPE_TERMS = [
  "platform",
  "app",
  "website",
  "plugin",
  "system",
  "agent",
  "automation",
  "dashboard",
  "saas",
  "marketplace",
  "crm",
  "erp",
  "pipeline",
  "integration",
  "deployment",
  "mobile app"
];

const DELIVERABLE_TERMS = [
  "report",
  "doc",
  "document",
  "presentation",
  "slide",
  "spreadsheet",
  "plugin",
  "prototype",
  "mvp",
  "api",
  "workflow",
  "plan",
  "dashboard",
  "email",
  "post",
  "video",
  "image"
];

const AUDIENCE_TERMS = [
  "customer",
  "client",
  "team",
  "manager",
  "founder",
  "developer",
  "designer",
  "student",
  "teacher",
  "investor",
  "user",
  "buyers",
  "admins"
];

const COMPLIANCE_TERMS = [
  "pii",
  "gdpr",
  "hipaa",
  "privacy",
  "medical",
  "financial",
  "bank",
  "consent",
  "legal",
  "compliance"
];

function normalize(text) {
  return String(text || "").replace(/\r/g, "").trim();
}

function lower(text) {
  return normalize(text).toLowerCase();
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function bulletify(items) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "- None";
}

function countMatches(text, list) {
  const hay = lower(text);
  return list.reduce((count, term) => count + (hay.includes(term) ? 1 : 0), 0);
}

function splitUnits(text) {
  return normalize(text)
    .split(/\n+|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function extractBullets(text) {
  return normalize(text)
    .split(/\n+/)
    .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
    .filter(Boolean);
}

function extractDeadlines(text) {
  const matches = normalize(text).match(/\b(today|tomorrow|tonight|this week|next week|this month|next month|q[1-4]|\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?|\d{4}-\d{2}-\d{2}|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d+\s*(?:day|days|week|weeks|month|months|hour|hours))\b/gi);
  return unique(matches || []);
}

function hasBudget(text) {
  return /\$\s?\d|\b\d+\s?(usd|inr|eur|dollars|rupees|budget)\b/i.test(text);
}

function hasMetric(text) {
  return /\b\d+\s?(%|percent|users|downloads|revenue|leads|hours|days|weeks|minutes|kpi|goal|target)\b/i.test(text);
}

function hasDeliverable(text) {
  return DELIVERABLE_TERMS.some((term) => lower(text).includes(term));
}

function hasAudience(text) {
  return AUDIENCE_TERMS.some((term) => lower(text).includes(term));
}

function hasOwner(text) {
  return /\b(i|we|team|owner|manager|designer|developer|marketing|sales|ops|admin|founder)\b/i.test(text);
}

function detectConstraints(text) {
  const constraints = [];
  if (hasBudget(text)) constraints.push("Budget constraints mentioned");
  if (extractDeadlines(text).length) constraints.push("Time deadline mentioned");
  if (/\b(no code|low code|without code|offline|local only|on-prem|privacy|private|open source|free|cheap|fast)\b/i.test(text)) constraints.push("Implementation constraints mentioned");
  if (/\b(token|api key|credentials|secret|oauth)\b/i.test(text)) constraints.push("Authentication or credential handling involved");
  return constraints;
}

function ambiguitySignals(text) {
  const signals = [];
  const ambiguousCount = countMatches(text, AMBIGUOUS_TERMS);
  if (ambiguousCount) signals.push(`${ambiguousCount} ambiguous wording signal(s)`);
  if (!hasDeliverable(text)) signals.push("Deliverable not clearly specified");
  if (!extractDeadlines(text).length) signals.push("Deadline or timing is missing");
  if (!hasAudience(text)) signals.push("Target audience or end user is missing");
  if (!hasMetric(text)) signals.push("Success metric or acceptance threshold is missing");
  if (!hasBudget(text) && /\b(build|launch|deploy|publish|run ads|market|scale)\b/i.test(text)) signals.push("Budget is missing for an execution-heavy request");
  if (!hasOwner(text)) signals.push("Owner/decision-maker is unclear");
  return signals;
}

function detectContradictions(text) {
  const issues = [];
  const hay = lower(text);
  if ((/\bcheap|free|low budget\b/i.test(text)) && (/\bpremium|enterprise|best in class|world class\b/i.test(text))) {
    issues.push("Budget expectation conflicts with premium-quality language");
  }
  if ((/\btoday|tomorrow|24 hours|48 hours|this week|1 day|2 days\b/i.test(text)) && countMatches(text, BIG_SCOPE_TERMS) >= 2) {
    issues.push("Timeline appears too short for the requested scope");
  }
  if ((/\bno code|without coding\b/i.test(text)) && (/\bplugin|api|integration|backend|automation\b/i.test(text))) {
    issues.push("No-code expectation conflicts with technical build language");
  }
  if (hay.includes("viral") && !hasAudience(text)) {
    issues.push("Growth goal is stated without a target audience");
  }
  return issues;
}

function detectMissingInfo(text) {
  const missing = [];
  if (!hasDeliverable(text)) missing.push("Exact output or deliverable");
  if (!hasAudience(text)) missing.push("Primary user or audience");
  if (!extractDeadlines(text).length) missing.push("Deadline or publishing window");
  if (!hasMetric(text)) missing.push("Success metric or acceptance criteria");
  if (!hasBudget(text) && /\bbuild|launch|publish|promote|ads|campaign|integration\b/i.test(text)) missing.push("Budget or resource limits");
  if (!/\bsource of truth|docs|repo|data|dataset|api|file|brief\b/i.test(text)) missing.push("Source material or data inputs");
  if (!/\bapprove|approval|sign off|reviewer|client|manager\b/i.test(text)) missing.push("Approval owner or review path");
  return missing;
}

function detectRisks(text) {
  const risks = [];
  if (countMatches(text, BIG_SCOPE_TERMS) >= 2) risks.push("Scope may be larger than it first appears");
  if (extractDeadlines(text).length) risks.push("Deadline pressure may reduce quality or validation time");
  if (COMPLIANCE_TERMS.some((term) => lower(text).includes(term))) risks.push("Legal/privacy review may be required");
  if (/\bpublish|upload|post|send|email|deploy|delete|replace\b/i.test(text)) risks.push("Action may have external or irreversible effects");
  if (/\bapi|token|oauth|secret|credential\b/i.test(text)) risks.push("Credential handling needs care and redaction");
  if (/\bdownload|scrape|crawl|collect data\b/i.test(text)) risks.push("Data rights or source terms may need verification");
  return unique(risks);
}

function detectStrengths(text) {
  const strengths = [];
  if (hasDeliverable(text)) strengths.push("A likely deliverable is already hinted");
  if (extractDeadlines(text).length) strengths.push("Timing signal exists");
  if (hasAudience(text)) strengths.push("Audience signal exists");
  if (hasMetric(text)) strengths.push("A measurable target or number is present");
  if (hasBudget(text)) strengths.push("Budget signal exists");
  return strengths;
}

function suggestQuestions(text, maxQuestions = 5) {
  const questions = [];
  if (!hasDeliverable(text)) questions.push("What exact output do you want at the end: plugin, doc, workflow, campaign, or something else?");
  if (!hasAudience(text)) questions.push("Who is the main user of this outcome, and what pain point should it solve first?");
  if (!extractDeadlines(text).length) questions.push("What is the real deadline or launch window?");
  if (!hasMetric(text)) questions.push("How will we judge success: downloads, revenue, time saved, conversion, or user satisfaction?");
  if (!hasBudget(text) && /\bbuild|launch|promote|ads|campaign|publish\b/i.test(text)) questions.push("What budget, resources, or limits should the plan respect?");
  if (!/\bapprove|approval|review\b/i.test(text)) questions.push("Who has final approval before anything is published or pushed live?");
  if (!/\bcompetitor|existing|similar|benchmark\b/i.test(text)) questions.push("Which existing alternatives should this beat, and on what dimension?");
  if (!/\bdata|repo|docs|file|api\b/i.test(text)) questions.push("What source files, docs, or APIs are available as the starting point?");
  return unique(questions).slice(0, maxQuestions);
}

function score(text) {
  const ambiguity = ambiguitySignals(text).length;
  const contradictions = detectContradictions(text).length;
  const risks = detectRisks(text).length;
  const strengths = detectStrengths(text).length;
  const missing = detectMissingInfo(text).length;

  const ambiguityScore = Math.max(0, Math.min(100, 20 + ambiguity * 10 + contradictions * 12 - strengths * 5));
  const readinessScore = Math.max(0, Math.min(100, 75 - ambiguity * 8 - contradictions * 10 - missing * 6 + strengths * 7));
  const riskScore = Math.max(0, Math.min(100, 15 + risks * 12 + contradictions * 10));
  return { ambiguityScore, readinessScore, riskScore };
}

function extractObjective(text) {
  const units = splitUnits(text);
  const candidate = units.find((u) => /\b(build|create|make|launch|write|design|publish|improve|analyze|research|plan|upload|deploy)\b/i.test(u)) || units[0] || "Objective not clear";
  return candidate;
}

function extractDeliverable(text) {
  const bullets = extractBullets(text);
  const candidate = bullets.find((line) => hasDeliverable(line)) || splitUnits(text).find((line) => hasDeliverable(line));
  return candidate || "No explicit deliverable found";
}

function firstSafeAction(text) {
  const missing = detectMissingInfo(text);
  if (missing.length >= 3) return "Pause execution and collect missing essentials before building.";
  if (detectContradictions(text).length) return "Resolve scope/timeline contradictions before committing to implementation.";
  if (/\bpublish|upload|deploy|send|delete\b/i.test(text)) return "Prepare a dry run or preview path before any external action.";
  return "Draft a short execution brief and begin with the smallest reversible step.";
}

function priorityLane(text) {
  const missing = detectMissingInfo(text).length;
  const contradictions = detectContradictions(text).length;
  if (contradictions > 0) return "Resolve contradictions first";
  if (missing >= 4) return "Clarify scope first";
  if (detectRisks(text).length >= 4) return "Risk review first";
  return "Execution-ready with light clarification";
}

function planStressTest(plan, objective = "") {
  const text = `${objective}\n${plan}`.trim();
  const failureModes = [];
  const mitigations = [];

  if (!extractDeadlines(text).length) {
    failureModes.push("No timeline checkpoint, so work can sprawl indefinitely");
    mitigations.push("Add 3 checkpoints: kickoff, review, release");
  }
  if (!hasMetric(text)) {
    failureModes.push("No acceptance metric, so success becomes subjective");
    mitigations.push("Define one measurable primary metric and one guardrail metric");
  }
  if (!/\bowner|responsible|who|team|reviewer|approver\b/i.test(text)) {
    failureModes.push("Approval and ownership path is unclear");
    mitigations.push("Assign builder, reviewer, and final approver roles");
  }
  if (!/\brollback|undo|backup|revert|draft|preview\b/i.test(text) && /\bpublish|deploy|send|replace|delete\b/i.test(text)) {
    failureModes.push("There is no rollback or preview path for external changes");
    mitigations.push("Add draft mode, preview artifacts, or a rollback step");
  }
  if (countMatches(text, BIG_SCOPE_TERMS) >= 2 && /\b1 day|2 days|today|tomorrow|this week\b/i.test(text)) {
    failureModes.push("Large scope compressed into a fragile timeline");
    mitigations.push("Split into MVP, V1, and post-launch backlog");
  }
  if (!/\bdocs|repo|api|dataset|brief|example\b/i.test(text)) {
    failureModes.push("Source inputs are not defined, increasing rework risk");
    mitigations.push("Identify source-of-truth docs, files, and examples before execution");
  }
  if (/\btoken|api key|secret|credential\b/i.test(text)) {
    failureModes.push("Secrets may leak during implementation or logging");
    mitigations.push("Use environment variables, redaction, and minimal secret exposure");
  }

  return {
    failureModes: unique(failureModes),
    mitigations: unique(mitigations),
    stressLevel: Math.min(100, 20 + unique(failureModes).length * 12),
    verdict: unique(failureModes).length >= 5 ? "Fragile" : unique(failureModes).length >= 3 ? "Needs reinforcement" : "Reasonably stable"
  };
}

function buildBrief(notes, outputStyle = "detailed") {
  const objective = extractObjective(notes);
  const deliverable = extractDeliverable(notes);
  const deadlines = extractDeadlines(notes);
  const constraints = detectConstraints(notes);
  const risks = detectRisks(notes);
  const openQuestions = suggestQuestions(notes, 5);
  const acceptance = [];

  if (hasDeliverable(notes)) acceptance.push("Deliverable exists in the requested format");
  if (hasAudience(notes)) acceptance.push("Target user is clearly addressed");
  if (hasMetric(notes)) acceptance.push("Success can be checked against a measurable signal");
  if (deadlines.length) acceptance.push(`Time expectation acknowledged: ${deadlines.join(", ")}`);
  if (!acceptance.length) acceptance.push("Acceptance criteria still need to be defined");

  const nextSteps = [
    firstSafeAction(notes),
    "Convert open questions into a short approval checklist.",
    "Start with the smallest reversible deliverable slice."
  ];

  const markdownSections = [
    "## Objective",
    objective,
    "",
    "## Deliverable",
    deliverable,
    "",
    "## Constraints",
    bulletify(constraints),
    "",
    "## Risks",
    bulletify(risks),
    "",
    "## Acceptance criteria",
    bulletify(acceptance),
    "",
    "## Open questions",
    bulletify(openQuestions),
    "",
    "## Suggested next steps",
    bulletify(unique(nextSteps))
  ];

  if (outputStyle === "checklist") {
    return {
      objective,
      deliverable,
      deadlines,
      constraints,
      risks,
      acceptanceCriteria: acceptance,
      openQuestions,
      nextSteps: unique(nextSteps),
      markdown: markdownSections.join("\n")
    };
  }

  if (outputStyle === "concise") {
    return {
      objective,
      deliverable,
      openQuestions,
      nextSteps: unique(nextSteps),
      markdown: [
        `Objective: ${objective}`,
        `Deliverable: ${deliverable}`,
        `Open questions: ${openQuestions.length ? openQuestions.join(" | ") : "None"}`,
        `Next: ${unique(nextSteps).join(" | ")}`
      ].join("\n")
    };
  }

  return {
    objective,
    deliverable,
    deadlines,
    constraints,
    risks,
    acceptanceCriteria: acceptance,
    openQuestions,
    nextSteps: unique(nextSteps),
    markdown: markdownSections.join("\n")
  };
}

function scanRequest(request, strictness = "standard", maxQuestions = 5) {
  const text = normalize(request);
  const signals = ambiguitySignals(text);
  const contradictions = detectContradictions(text);
  const missing = detectMissingInfo(text);
  const risks = detectRisks(text);
  const strengths = detectStrengths(text);
  const questions = suggestQuestions(text, maxQuestions);
  const scores = score(text);

  const strictBump = strictness === "hard" ? 8 : strictness === "lite" ? -8 : 0;
  const readinessScore = Math.max(0, Math.min(100, scores.readinessScore - strictBump));
  const ambiguityScore = Math.max(0, Math.min(100, scores.ambiguityScore + strictBump));

  const result = {
    objective: extractObjective(text),
    deliverable: extractDeliverable(text),
    priorityLane: priorityLane(text),
    firstSafeAction: firstSafeAction(text),
    ambiguityScore,
    readinessScore,
    riskScore: scores.riskScore,
    strengths,
    ambiguitySignals: signals,
    contradictions,
    missingInfo: missing,
    risks,
    suggestedQuestions: questions,
    deadlines: extractDeadlines(text),
    constraints: detectConstraints(text),
    readyToExecute: readinessScore >= 70 && contradictions.length === 0 && missing.length <= 2
  };

  const markdown = [
    "# Mission Preflight Report",
    `**Objective:** ${result.objective}`,
    `**Deliverable signal:** ${result.deliverable}`,
    `**Priority lane:** ${result.priorityLane}`,
    `**First safe action:** ${result.firstSafeAction}`,
    "",
    "## Scores",
    `- Readiness: ${result.readinessScore}/100`,
    `- Ambiguity: ${result.ambiguityScore}/100`,
    `- Risk: ${result.riskScore}/100`,
    `- Ready to execute: ${result.readyToExecute ? "Yes" : "Not yet"}`,
    "",
    "## Strengths",
    bulletify(result.strengths),
    "",
    "## Missing info",
    bulletify(result.missingInfo),
    "",
    "## Ambiguity signals",
    bulletify(result.ambiguitySignals),
    "",
    "## Contradictions",
    bulletify(result.contradictions),
    "",
    "## Risks",
    bulletify(result.risks),
    "",
    "## Suggested clarification questions",
    bulletify(result.suggestedQuestions),
    "",
    "## Constraints",
    bulletify(result.constraints),
    "",
    "## Deadlines found",
    bulletify(result.deadlines)
  ].join("\n");

  return { ...result, markdown };
}

function textResult(title, payload) {
  return {
    content: [
      {
        type: "text",
        text: `${title}\n\n${payload.markdown}\n\n---\nJSON summary:\n${JSON.stringify(payload, null, 2)}`
      }
    ]
  };
}

export default definePluginEntry({
  id: "mission-preflight",
  name: "Mission Preflight",
  register(api) {
    api.registerTool({
      name: "mission_preflight_scan",
      description: "Turn a vague request into an execution-readiness report with missing info, hidden risks, contradictions, and high-value next questions.",
      parameters: Type.Object({
        request: Type.String({ description: "The raw task, idea, prompt, or user request to analyze." }),
        strictness: Type.Optional(Type.Union([
          Type.Literal("lite"),
          Type.Literal("standard"),
          Type.Literal("hard")
        ], { description: "How strict the readiness scoring should be." })),
        maxQuestions: Type.Optional(Type.Number({ minimum: 1, maximum: 10, default: 5, description: "Maximum clarification questions to return." }))
      }),
      async execute(_id, params) {
        const payload = scanRequest(params.request, params.strictness || "standard", params.maxQuestions || 5);
        return textResult("Mission Preflight Scan", payload);
      }
    });

    api.registerTool({
      name: "mission_preflight_stress_test",
      description: "Pressure-test a plan, launch checklist, or implementation outline and reveal likely failure modes before execution.",
      parameters: Type.Object({
        plan: Type.String({ description: "The plan, checklist, rollout sequence, or execution notes to stress test." }),
        objective: Type.Optional(Type.String({ description: "Optional overall goal for additional context." }))
      }),
      async execute(_id, params) {
        const payload = planStressTest(params.plan, params.objective || "");
        payload.markdown = [
          "# Mission Preflight Stress Test",
          `**Verdict:** ${payload.verdict}`,
          `**Stress level:** ${payload.stressLevel}/100`,
          "",
          "## Failure modes",
          bulletify(payload.failureModes),
          "",
          "## Mitigations",
          bulletify(payload.mitigations)
        ].join("\n");
        return textResult("Mission Preflight Stress Test", payload);
      }
    });

    api.registerTool({
      name: "mission_preflight_brief",
      description: "Convert messy notes into a compact execution brief with constraints, risks, acceptance criteria, and next steps.",
      parameters: Type.Object({
        notes: Type.String({ description: "Unstructured notes, request text, or planning draft." }),
        outputStyle: Type.Optional(Type.Union([
          Type.Literal("concise"),
          Type.Literal("detailed"),
          Type.Literal("checklist")
        ], { description: "Preferred brief style." }))
      }),
      async execute(_id, params) {
        const payload = buildBrief(params.notes, params.outputStyle || "detailed");
        return textResult("Mission Preflight Brief", payload);
      }
    });
  }
});
