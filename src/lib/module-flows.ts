// "What naturally comes next" map. After saving a doc in one module, the
// editor surfaces 2-3 suggested next modules with a one-line rationale.
//
// Adding a new flow is one line: key is "<category>/<moduleSlug>", value is an
// ordered list of next steps. Unmapped modules simply show no suggestions.
//
// Keep rationales short and imperative — they render as the card row label.

export interface NextStep {
  category: string;
  moduleSlug: string;
  // Imperative one-liner shown on the card row, e.g. "Generate user stories".
  label: string;
  // Why this comes next — shown as the secondary line.
  rationale: string;
}

export const MODULE_FLOWS: Record<string, NextStep[]> = {
  // ── Specs ───────────────────────────────────────────────────────────────
  'specs/prd': [
    {
      category: 'specs',
      moduleSlug: 'user-stories',
      label: 'Generate user stories',
      rationale: 'Break the PRD into stories engineering can estimate',
    },
    {
      category: 'launch',
      moduleSlug: 'release-notes',
      label: 'Draft release notes',
      rationale: 'Turn the shipped scope into a customer-facing note',
    },
    {
      category: 'communication',
      moduleSlug: 'exec-update',
      label: 'Write exec update',
      rationale: 'Summarize the plan for leadership',
    },
  ],
  'specs/user-stories': [
    {
      category: 'specs',
      moduleSlug: 'tech-spec',
      label: 'Write a tech spec',
      rationale: 'Detail the implementation behind the stories',
    },
    {
      category: 'planning',
      moduleSlug: 'backlog',
      label: 'Prioritize the backlog',
      rationale: 'Rank the stories by impact and effort',
    },
  ],
  'specs/one-pager': [
    {
      category: 'specs',
      moduleSlug: 'prd',
      label: 'Expand into a PRD',
      rationale: 'Flesh the one-pager into a full requirements doc',
    },
    {
      category: 'strategy',
      moduleSlug: 'positioning',
      label: 'Sharpen positioning',
      rationale: 'Lock the value proposition before building',
    },
  ],

  // ── Discovery ─────────────────────────────────────────────────────────────
  'discovery/interviews': [
    {
      category: 'discovery',
      moduleSlug: 'synthesis',
      label: 'Synthesize findings',
      rationale: 'Pull themes across all your interviews',
    },
    {
      category: 'discovery',
      moduleSlug: 'personas',
      label: 'Build a persona',
      rationale: 'Turn patterns into a representative user',
    },
    {
      category: 'discovery',
      moduleSlug: 'jtbd',
      label: 'Extract jobs-to-be-done',
      rationale: 'Frame the underlying motivations',
    },
  ],
  'discovery/synthesis': [
    {
      category: 'discovery',
      moduleSlug: 'assumptions',
      label: 'Log assumptions',
      rationale: 'Capture what still needs validating',
    },
    {
      category: 'strategy',
      moduleSlug: 'positioning',
      label: 'Draft positioning',
      rationale: 'Translate insights into a market stance',
    },
  ],
  'discovery/personas': [
    {
      category: 'discovery',
      moduleSlug: 'journey-map',
      label: 'Map their journey',
      rationale: 'Chart the persona’s end-to-end experience',
    },
    {
      category: 'specs',
      moduleSlug: 'prd',
      label: 'Spec a solution',
      rationale: 'Design for the persona’s top pain point',
    },
  ],

  // ── Strategy ────────────────────────────────────────────────────────────
  'strategy/okrs': [
    {
      category: 'planning',
      moduleSlug: 'roadmap',
      label: 'Build the roadmap',
      rationale: 'Sequence the work that hits these objectives',
    },
    {
      category: 'analytics',
      moduleSlug: 'okr-tracker',
      label: 'Track progress',
      rationale: 'Stand up measurement against the key results',
    },
  ],
  'strategy/positioning': [
    {
      category: 'strategy',
      moduleSlug: 'gtm',
      label: 'Plan go-to-market',
      rationale: 'Turn the position into a launch motion',
    },
    {
      category: 'launch',
      moduleSlug: 'announcement',
      label: 'Write the announcement',
      rationale: 'Draft the public narrative',
    },
  ],
  'strategy/gtm': [
    {
      category: 'launch',
      moduleSlug: 'readiness',
      label: 'Run a readiness check',
      rationale: 'Confirm every function is launch-ready',
    },
    {
      category: 'launch',
      moduleSlug: 'sales-enablement',
      label: 'Enable sales',
      rationale: 'Equip the team with messaging and collateral',
    },
  ],
  'strategy/north-star': [
    {
      category: 'strategy',
      moduleSlug: 'metric-tree',
      label: 'Decompose the metric',
      rationale: 'Map inputs and levers under the north star',
    },
    {
      category: 'strategy',
      moduleSlug: 'okrs',
      label: 'Set OKRs',
      rationale: 'Translate the north star into quarterly goals',
    },
  ],

  // ── Planning ──────────────────────────────────────────────────────────────
  'planning/roadmap': [
    {
      category: 'planning',
      moduleSlug: 'quarterly',
      label: 'Plan the quarter',
      rationale: 'Break the roadmap into a quarterly plan',
    },
    {
      category: 'planning',
      moduleSlug: 'sprints',
      label: 'Plan sprints',
      rationale: 'Schedule the near-term work',
    },
  ],
  'planning/backlog': [
    {
      category: 'planning',
      moduleSlug: 'sprints',
      label: 'Plan a sprint',
      rationale: 'Pull the top backlog items into a sprint',
    },
    {
      category: 'planning',
      moduleSlug: 'dependencies',
      label: 'Map dependencies',
      rationale: 'Surface what blocks the prioritized work',
    },
  ],

  // ── Launch ──────────────────────────────────────────────────────────────
  'launch/readiness': [
    {
      category: 'launch',
      moduleSlug: 'checklist',
      label: 'Build a launch checklist',
      rationale: 'Turn gaps into trackable launch tasks',
    },
    {
      category: 'launch',
      moduleSlug: 'announcement',
      label: 'Draft the announcement',
      rationale: 'Prep the launch-day narrative',
    },
  ],
  'launch/announcement': [
    {
      category: 'launch',
      moduleSlug: 'release-notes',
      label: 'Write release notes',
      rationale: 'Document what shipped for customers',
    },
    {
      category: 'launch',
      moduleSlug: 'changelog',
      label: 'Update the changelog',
      rationale: 'Log this release in the running history',
    },
  ],

  // ── Operations ────────────────────────────────────────────────────────────
  'operations/post-mortem': [
    {
      category: 'operations',
      moduleSlug: 'processes',
      label: 'Codify a process',
      rationale: 'Turn the learnings into a repeatable runbook',
    },
    {
      category: 'operations',
      moduleSlug: 'retro',
      label: 'Run a retro',
      rationale: 'Close the loop with the team',
    },
  ],
};

export function getNextSteps(category: string, moduleSlug: string): NextStep[] {
  return MODULE_FLOWS[`${category}/${moduleSlug}`] ?? [];
}
