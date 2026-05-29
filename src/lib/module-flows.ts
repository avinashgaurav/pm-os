// "What naturally comes next" map. After saving a doc in one module, the
// editor surfaces 2-3 suggested next modules with a one-line rationale.
//
// Adding a flow: add an entry keyed by "<category>/<moduleSlug>" with an
// ordered list of next steps. Unmapped modules show no suggestions. `category`
// is typed as CategorySlug so a wrong category fails tsc rather than producing
// a dead navigation target at runtime.

import type { CategorySlug } from '@/types';

export interface NextStep {
  category: CategorySlug;
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
      category: 'communication',
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
      category: 'communication',
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

  // ──────────────────────────────────────────────────────────────────────────
  // Full coverage (#68): a flow for every remaining module so "What's next"
  // appears on all 82.
  // ──────────────────────────────────────────────────────────────────────────

  // ── Discovery ─────────────────────────────────────────────────────────────
  'discovery/jtbd': [
    {
      category: 'discovery',
      moduleSlug: 'personas',
      label: 'Build a persona',
      rationale: 'Give the jobs a face and context',
    },
    {
      category: 'specs',
      moduleSlug: 'prd',
      label: 'Spec the solution',
      rationale: 'Design for the top job-to-be-done',
    },
  ],
  'discovery/journey-map': [
    {
      category: 'discovery',
      moduleSlug: 'feedback',
      label: 'Categorize feedback',
      rationale: 'Attach real voice to each journey stage',
    },
    {
      category: 'strategy',
      moduleSlug: 'ost',
      label: 'Map opportunities',
      rationale: 'Turn pain points into an opportunity tree',
    },
  ],
  'discovery/feedback': [
    {
      category: 'discovery',
      moduleSlug: 'synthesis',
      label: 'Synthesize themes',
      rationale: 'Roll categorized feedback into insights',
    },
    {
      category: 'discovery',
      moduleSlug: 'feature-requests',
      label: 'Track feature requests',
      rationale: 'Promote recurring asks into a tracked list',
    },
  ],
  'discovery/surveys': [
    {
      category: 'discovery',
      moduleSlug: 'synthesis',
      label: 'Synthesize results',
      rationale: 'Turn survey responses into findings',
    },
    {
      category: 'analytics',
      moduleSlug: 'metrics',
      label: 'Define metrics',
      rationale: 'Operationalize what the survey measured',
    },
  ],
  'discovery/app-reviews': [
    {
      category: 'discovery',
      moduleSlug: 'feedback',
      label: 'Categorize the themes',
      rationale: 'Bucket review insights with other feedback',
    },
    {
      category: 'planning',
      moduleSlug: 'backlog',
      label: 'Prioritize fixes',
      rationale: 'Rank the issues reviews surfaced',
    },
  ],
  'discovery/feature-requests': [
    {
      category: 'strategy',
      moduleSlug: 'scoring',
      label: 'Score the requests',
      rationale: 'Apply RICE/ICE to rank them',
    },
    {
      category: 'planning',
      moduleSlug: 'backlog',
      label: 'Add to backlog',
      rationale: 'Move accepted asks into delivery',
    },
  ],
  'discovery/customer-voice': [
    {
      category: 'discovery',
      moduleSlug: 'synthesis',
      label: 'Synthesize themes',
      rationale: 'Pull patterns from the VoC data',
    },
    {
      category: 'strategy',
      moduleSlug: 'positioning',
      label: 'Sharpen positioning',
      rationale: 'Ground the value prop in customer language',
    },
  ],
  'discovery/feedback-wall': [
    {
      category: 'discovery',
      moduleSlug: 'feedback',
      label: 'Categorize it',
      rationale: 'Structure the wall into themes',
    },
    {
      category: 'discovery',
      moduleSlug: 'synthesis',
      label: 'Synthesize insights',
      rationale: 'Extract what the wall is telling you',
    },
  ],
  'discovery/assumptions': [
    {
      category: 'analytics',
      moduleSlug: 'experiments',
      label: 'Design an experiment',
      rationale: 'Test the riskiest assumption',
    },
    {
      category: 'growth',
      moduleSlug: 'hypothesis-board',
      label: 'Form a hypothesis',
      rationale: 'Turn an assumption into a testable claim',
    },
  ],

  // ── Strategy ────────────────────────────────────────────────────────────
  'strategy/swot': [
    {
      category: 'strategy',
      moduleSlug: 'positioning',
      label: 'Draft positioning',
      rationale: 'Turn strengths into a market stance',
    },
    {
      category: 'strategy',
      moduleSlug: 'decisions',
      label: 'Log a decision',
      rationale: 'Capture the strategic call SWOT informs',
    },
  ],
  'strategy/bcg-matrix': [
    {
      category: 'strategy',
      moduleSlug: 'roadmap-review',
      label: 'Review the roadmap',
      rationale: 'Reallocate investment by quadrant',
    },
    {
      category: 'strategy',
      moduleSlug: 'build-vs-buy',
      label: 'Build vs buy',
      rationale: 'Decide how to fund the question marks',
    },
  ],
  'strategy/ost': [
    {
      category: 'analytics',
      moduleSlug: 'experiments',
      label: 'Design experiments',
      rationale: 'Test the solutions on the tree',
    },
    {
      category: 'specs',
      moduleSlug: 'prd',
      label: 'Spec the top branch',
      rationale: 'Turn the best opportunity into a PRD',
    },
  ],
  'strategy/vpc': [
    {
      category: 'strategy',
      moduleSlug: 'positioning',
      label: 'Write positioning',
      rationale: 'Translate the value prop into a stance',
    },
    {
      category: 'specs',
      moduleSlug: 'one-pager',
      label: 'Draft a one-pager',
      rationale: 'Pitch the value prop concisely',
    },
  ],
  'strategy/risk-register': [
    {
      category: 'communication',
      moduleSlug: 'exec-update',
      label: 'Brief leadership',
      rationale: 'Surface top risks to stakeholders',
    },
    {
      category: 'launch',
      moduleSlug: 'readiness',
      label: 'Check readiness',
      rationale: 'Confirm mitigations before launch',
    },
  ],
  'strategy/build-vs-buy': [
    {
      category: 'strategy',
      moduleSlug: 'decisions',
      label: 'Log the decision',
      rationale: 'Record the build/buy call and its rationale',
    },
    {
      category: 'specs',
      moduleSlug: 'tech-spec',
      label: 'Spec the build',
      rationale: 'Detail the implementation if building',
    },
  ],
  'strategy/ai-strategy': [
    {
      category: 'specs',
      moduleSlug: 'prd',
      label: 'Spec an AI feature',
      rationale: 'Turn the strategy into a buildable feature',
    },
    {
      category: 'strategy',
      moduleSlug: 'risk-register',
      label: 'Log AI risks',
      rationale: 'Capture model/data/safety risks',
    },
  ],
  'strategy/pricing': [
    {
      category: 'strategy',
      moduleSlug: 'gtm',
      label: 'Plan go-to-market',
      rationale: 'Fold pricing into the launch motion',
    },
    {
      category: 'competitive',
      moduleSlug: 'profiles',
      label: 'Profile competitors',
      rationale: 'Sanity-check pricing against the market',
    },
  ],
  'strategy/roadmap-review': [
    {
      category: 'planning',
      moduleSlug: 'roadmap',
      label: 'Update the roadmap',
      rationale: 'Apply the review’s conclusions',
    },
    {
      category: 'communication',
      moduleSlug: 'exec-update',
      label: 'Brief leadership',
      rationale: 'Communicate roadmap changes',
    },
  ],
  'strategy/devils-advocate': [
    {
      category: 'strategy',
      moduleSlug: 'decisions',
      label: 'Log the decision',
      rationale: 'Record the call after stress-testing it',
    },
    {
      category: 'strategy',
      moduleSlug: 'risk-register',
      label: 'Log the risks',
      rationale: 'Capture the holes the critique found',
    },
  ],
  'strategy/metric-tree': [
    {
      category: 'strategy',
      moduleSlug: 'okrs',
      label: 'Set OKRs',
      rationale: 'Turn levers into quarterly targets',
    },
    {
      category: 'analytics',
      moduleSlug: 'dashboards',
      label: 'Design a dashboard',
      rationale: 'Instrument the tree’s inputs',
    },
  ],
  'strategy/vision-board': [
    {
      category: 'strategy',
      moduleSlug: 'north-star',
      label: 'Define a north star',
      rationale: 'Anchor the vision in one metric',
    },
    {
      category: 'planning',
      moduleSlug: 'roadmap',
      label: 'Build the roadmap',
      rationale: 'Sequence the path toward the vision',
    },
  ],
  'strategy/decisions': [
    {
      category: 'communication',
      moduleSlug: 'decision-doc',
      label: 'Write the decision doc',
      rationale: 'Document the call for the org',
    },
    {
      category: 'communication',
      moduleSlug: 'exec-update',
      label: 'Brief leadership',
      rationale: 'Communicate the decision upward',
    },
  ],
  'strategy/scoring': [
    {
      category: 'planning',
      moduleSlug: 'backlog',
      label: 'Build the backlog',
      rationale: 'Order delivery by the scores',
    },
    {
      category: 'planning',
      moduleSlug: 'roadmap',
      label: 'Shape the roadmap',
      rationale: 'Sequence the top-scored bets',
    },
  ],

  // ── Specs ───────────────────────────────────────────────────────────────
  'specs/brief': [
    {
      category: 'specs',
      moduleSlug: 'prd',
      label: 'Expand into a PRD',
      rationale: 'Flesh the brief into full requirements',
    },
    {
      category: 'strategy',
      moduleSlug: 'positioning',
      label: 'Sharpen positioning',
      rationale: 'Lock the value prop before building',
    },
  ],
  'specs/tech-spec': [
    {
      category: 'planning',
      moduleSlug: 'decomposition',
      label: 'Decompose the work',
      rationale: 'Break the spec into buildable pieces',
    },
    {
      category: 'planning',
      moduleSlug: 'sprints',
      label: 'Plan sprints',
      rationale: 'Schedule the implementation',
    },
  ],
  'specs/api-docs': [
    {
      category: 'specs',
      moduleSlug: 'onboarding',
      label: 'Design onboarding',
      rationale: 'Guide developers to first call',
    },
    {
      category: 'communication',
      moduleSlug: 'release-notes',
      label: 'Draft release notes',
      rationale: 'Announce the API to consumers',
    },
  ],
  'specs/onboarding': [
    {
      category: 'analytics',
      moduleSlug: 'funnels',
      label: 'Analyze the funnel',
      rationale: 'Find drop-off in the onboarding steps',
    },
    {
      category: 'analytics',
      moduleSlug: 'ab-design',
      label: 'Design an A/B test',
      rationale: 'Experiment on the activation flow',
    },
  ],
  'specs/story-map': [
    {
      category: 'specs',
      moduleSlug: 'user-stories',
      label: 'Write the stories',
      rationale: 'Turn the map into estimable stories',
    },
    {
      category: 'planning',
      moduleSlug: 'backlog',
      label: 'Prioritize them',
      rationale: 'Slice the map into a release backlog',
    },
  ],

  // ── Planning ──────────────────────────────────────────────────────────────
  'planning/quarterly': [
    {
      category: 'planning',
      moduleSlug: 'sprints',
      label: 'Plan sprints',
      rationale: 'Break the quarter into sprints',
    },
    {
      category: 'strategy',
      moduleSlug: 'okrs',
      label: 'Set OKRs',
      rationale: 'Tie the quarter to measurable goals',
    },
  ],
  'planning/sprints': [
    {
      category: 'planning',
      moduleSlug: 'velocity',
      label: 'Track velocity',
      rationale: 'Measure throughput against the plan',
    },
    {
      category: 'operations',
      moduleSlug: 'retro',
      label: 'Run a retro',
      rationale: 'Reflect at the end of the sprint',
    },
  ],
  'planning/decomposition': [
    {
      category: 'specs',
      moduleSlug: 'user-stories',
      label: 'Write stories',
      rationale: 'Turn the breakdown into stories',
    },
    {
      category: 'planning',
      moduleSlug: 'dependencies',
      label: 'Map dependencies',
      rationale: 'Surface what blocks the pieces',
    },
  ],
  'planning/daily': [
    {
      category: 'planning',
      moduleSlug: 'weekly',
      label: 'Plan the week',
      rationale: 'Zoom out to the weekly horizon',
    },
    {
      category: 'communication',
      moduleSlug: 'meeting-notes',
      label: 'Capture standup notes',
      rationale: 'Log decisions from the daily',
    },
  ],
  'planning/weekly': [
    {
      category: 'planning',
      moduleSlug: 'quarterly',
      label: 'Plan the quarter',
      rationale: 'Connect the week to bigger goals',
    },
    {
      category: 'communication',
      moduleSlug: 'exec-update',
      label: 'Write an update',
      rationale: 'Summarize the week for stakeholders',
    },
  ],
  'planning/release-calendar': [
    {
      category: 'launch',
      moduleSlug: 'readiness',
      label: 'Check readiness',
      rationale: 'Confirm each release is launch-ready',
    },
    {
      category: 'communication',
      moduleSlug: 'release-notes',
      label: 'Draft release notes',
      rationale: 'Prep the customer-facing note',
    },
  ],
  'planning/velocity': [
    {
      category: 'planning',
      moduleSlug: 'sprints',
      label: 'Plan the next sprint',
      rationale: 'Use the trend to size the next one',
    },
    {
      category: 'operations',
      moduleSlug: 'team-health',
      label: 'Check team health',
      rationale: 'Read velocity alongside team signals',
    },
  ],
  'planning/dependencies': [
    {
      category: 'planning',
      moduleSlug: 'sprints',
      label: 'Plan around them',
      rationale: 'Sequence sprints to clear blockers first',
    },
    {
      category: 'strategy',
      moduleSlug: 'risk-register',
      label: 'Log dependency risks',
      rationale: 'Track the ones that could slip',
    },
  ],

  // ── Analytics ───────────────────────────────────────────────────────────
  'analytics/metrics': [
    {
      category: 'analytics',
      moduleSlug: 'dashboards',
      label: 'Design a dashboard',
      rationale: 'Visualize the metrics you defined',
    },
    {
      category: 'strategy',
      moduleSlug: 'north-star',
      label: 'Pick a north star',
      rationale: 'Elevate the one metric that matters most',
    },
  ],
  'analytics/ab-design': [
    {
      category: 'analytics',
      moduleSlug: 'ab-analysis',
      label: 'Analyze the results',
      rationale: 'Read the experiment once it runs',
    },
    {
      category: 'analytics',
      moduleSlug: 'experiments',
      label: 'Log the experiment',
      rationale: 'Add it to the experiment pipeline',
    },
  ],
  'analytics/ab-analysis': [
    {
      category: 'strategy',
      moduleSlug: 'decisions',
      label: 'Log the decision',
      rationale: 'Ship/kill based on the result',
    },
    {
      category: 'growth',
      moduleSlug: 'hypothesis-board',
      label: 'Update the hypothesis',
      rationale: 'Mark the claim validated or not',
    },
  ],
  'analytics/funnels': [
    {
      category: 'analytics',
      moduleSlug: 'ab-design',
      label: 'Design an A/B test',
      rationale: 'Experiment on the worst drop-off',
    },
    {
      category: 'discovery',
      moduleSlug: 'interviews',
      label: 'Talk to users',
      rationale: 'Understand why they drop off',
    },
  ],
  'analytics/experiments': [
    {
      category: 'analytics',
      moduleSlug: 'ab-analysis',
      label: 'Analyze results',
      rationale: 'Read the experiment outcome',
    },
    {
      category: 'analytics',
      moduleSlug: 'okr-tracker',
      label: 'Track impact',
      rationale: 'Connect the result to the goal',
    },
  ],
  'analytics/dashboards': [
    {
      category: 'analytics',
      moduleSlug: 'metrics',
      label: 'Refine the metrics',
      rationale: 'Tighten definitions the dashboard exposed',
    },
    {
      category: 'communication',
      moduleSlug: 'exec-update',
      label: 'Brief leadership',
      rationale: 'Share what the dashboard shows',
    },
  ],
  'analytics/okr-tracker': [
    {
      category: 'communication',
      moduleSlug: 'exec-update',
      label: 'Write an update',
      rationale: 'Report OKR progress upward',
    },
    {
      category: 'strategy',
      moduleSlug: 'roadmap-review',
      label: 'Review the roadmap',
      rationale: 'Adjust plans for off-track KRs',
    },
  ],

  // ── Competitive ─────────────────────────────────────────────────────────
  'competitive/profiles': [
    {
      category: 'competitive',
      moduleSlug: 'landscape',
      label: 'Map the landscape',
      rationale: 'Place the profile on the field',
    },
    {
      category: 'strategy',
      moduleSlug: 'positioning',
      label: 'Sharpen positioning',
      rationale: 'Differentiate against this competitor',
    },
  ],
  'competitive/landscape': [
    {
      category: 'strategy',
      moduleSlug: 'positioning',
      label: 'Draft positioning',
      rationale: 'Stake a clear position on the map',
    },
    {
      category: 'competitive',
      moduleSlug: 'impact-effort',
      label: 'Prioritize responses',
      rationale: 'Rank competitive moves to make',
    },
  ],
  'competitive/market-sizing': [
    {
      category: 'strategy',
      moduleSlug: 'gtm',
      label: 'Plan go-to-market',
      rationale: 'Aim the motion at the sized market',
    },
    {
      category: 'communication',
      moduleSlug: 'board-deck',
      label: 'Build a board deck',
      rationale: 'Use the TAM/SAM/SOM in the narrative',
    },
  ],
  'competitive/win-loss': [
    {
      category: 'strategy',
      moduleSlug: 'positioning',
      label: 'Adjust positioning',
      rationale: 'Fix the gaps deals are lost on',
    },
    {
      category: 'launch',
      moduleSlug: 'sales-enablement',
      label: 'Enable sales',
      rationale: 'Arm reps against the loss reasons',
    },
  ],
  'competitive/impact-effort': [
    {
      category: 'planning',
      moduleSlug: 'backlog',
      label: 'Build the backlog',
      rationale: 'Promote the high-impact/low-effort wins',
    },
    {
      category: 'planning',
      moduleSlug: 'roadmap',
      label: 'Shape the roadmap',
      rationale: 'Sequence the prioritized moves',
    },
  ],

  // ── Communication ───────────────────────────────────────────────────────
  'communication/release-notes': [
    {
      category: 'launch',
      moduleSlug: 'changelog',
      label: 'Update the changelog',
      rationale: 'Log the release in the running history',
    },
    {
      category: 'launch',
      moduleSlug: 'announcement',
      label: 'Write the announcement',
      rationale: 'Amplify the notable changes',
    },
  ],
  'communication/exec-update': [
    {
      category: 'communication',
      moduleSlug: 'board-deck',
      label: 'Build a board deck',
      rationale: 'Expand the update for the board',
    },
    {
      category: 'strategy',
      moduleSlug: 'okrs',
      label: 'Revisit OKRs',
      rationale: 'Re-anchor on goals after reporting',
    },
  ],
  'communication/stakeholder-sim': [
    {
      category: 'communication',
      moduleSlug: 'stakeholder-map',
      label: 'Map stakeholders',
      rationale: 'Plot influence/interest from the sim',
    },
    {
      category: 'communication',
      moduleSlug: 'exec-update',
      label: 'Tailor the update',
      rationale: 'Frame the message per stakeholder',
    },
  ],
  'communication/meeting-notes': [
    {
      category: 'communication',
      moduleSlug: 'decision-doc',
      label: 'Write a decision doc',
      rationale: 'Formalize decisions the meeting reached',
    },
    {
      category: 'planning',
      moduleSlug: 'daily',
      label: 'Plan the follow-ups',
      rationale: 'Turn action items into a plan',
    },
  ],
  'communication/decision-doc': [
    {
      category: 'strategy',
      moduleSlug: 'decisions',
      label: 'Log the decision',
      rationale: 'Add it to the decision log',
    },
    {
      category: 'communication',
      moduleSlug: 'exec-update',
      label: 'Brief leadership',
      rationale: 'Communicate the decision upward',
    },
  ],
  'communication/board-deck': [
    {
      category: 'communication',
      moduleSlug: 'exec-update',
      label: 'Draft the pre-read',
      rationale: 'Summarize the deck for async review',
    },
    {
      category: 'strategy',
      moduleSlug: 'north-star',
      label: 'Anchor the metric',
      rationale: 'Lead with the one number that matters',
    },
  ],
  'communication/agenda': [
    {
      category: 'communication',
      moduleSlug: 'meeting-notes',
      label: 'Capture notes',
      rationale: 'Run the meeting and log outcomes',
    },
    {
      category: 'operations',
      moduleSlug: 'meeting-templates',
      label: 'Save as a template',
      rationale: 'Reuse this agenda shape',
    },
  ],
  'communication/stakeholder-map': [
    {
      category: 'communication',
      moduleSlug: 'exec-update',
      label: 'Tailor updates',
      rationale: 'Communicate per the influence map',
    },
    {
      category: 'communication',
      moduleSlug: 'stakeholder-sim',
      label: 'Rehearse the conversation',
      rationale: 'Pressure-test a tricky stakeholder',
    },
  ],

  // ── Launch ──────────────────────────────────────────────────────────────
  'launch/checklist': [
    {
      category: 'launch',
      moduleSlug: 'readiness',
      label: 'Assess readiness',
      rationale: 'Roll the checklist into a go/no-go',
    },
    {
      category: 'launch',
      moduleSlug: 'announcement',
      label: 'Draft the announcement',
      rationale: 'Prep the launch-day narrative',
    },
  ],
  'launch/sales-enablement': [
    {
      category: 'launch',
      moduleSlug: 'announcement',
      label: 'Write the announcement',
      rationale: 'Pair enablement with the public story',
    },
    {
      category: 'competitive',
      moduleSlug: 'win-loss',
      label: 'Review win/loss',
      rationale: 'Fold loss reasons into the kit',
    },
  ],
  'launch/changelog': [
    {
      category: 'communication',
      moduleSlug: 'release-notes',
      label: 'Write release notes',
      rationale: 'Expand a changelog entry for customers',
    },
    {
      category: 'launch',
      moduleSlug: 'announcement',
      label: 'Announce highlights',
      rationale: 'Amplify the notable entries',
    },
  ],

  // ── Operations ────────────────────────────────────────────────────────────
  'operations/retro': [
    {
      category: 'operations',
      moduleSlug: 'processes',
      label: 'Update a process',
      rationale: 'Bake action items into the runbook',
    },
    {
      category: 'operations',
      moduleSlug: 'team-health',
      label: 'Check team health',
      rationale: 'Track the trend the retro surfaced',
    },
  ],
  'operations/team-health': [
    {
      category: 'operations',
      moduleSlug: 'retro',
      label: 'Run a retro',
      rationale: 'Dig into the signals with the team',
    },
    {
      category: 'communication',
      moduleSlug: 'exec-update',
      label: 'Surface to leadership',
      rationale: 'Flag health risks upward',
    },
  ],
  'operations/processes': [
    {
      category: 'operations',
      moduleSlug: 'meeting-templates',
      label: 'Template the rituals',
      rationale: 'Standardize the meetings the process needs',
    },
    {
      category: 'operations',
      moduleSlug: 'cs-playbook',
      label: 'Build a playbook',
      rationale: 'Operationalize for the CS team',
    },
  ],
  'operations/cs-playbook': [
    {
      category: 'discovery',
      moduleSlug: 'feedback',
      label: 'Categorize CS feedback',
      rationale: 'Channel support signal into discovery',
    },
    {
      category: 'operations',
      moduleSlug: 'processes',
      label: 'Codify the process',
      rationale: 'Turn the playbook into a runbook',
    },
  ],
  'operations/meeting-templates': [
    {
      category: 'communication',
      moduleSlug: 'agenda',
      label: 'Build an agenda',
      rationale: 'Instantiate the template for a meeting',
    },
    {
      category: 'communication',
      moduleSlug: 'meeting-notes',
      label: 'Capture notes',
      rationale: 'Run a meeting from the template',
    },
  ],

  // ── Growth ──────────────────────────────────────────────────────────────
  'growth/competency': [
    {
      category: 'growth',
      moduleSlug: 'knowledge-base',
      label: 'Build knowledge',
      rationale: 'Close skill gaps with curated learning',
    },
    {
      category: 'operations',
      moduleSlug: 'team-health',
      label: 'Check team health',
      rationale: 'Read competency alongside team signals',
    },
  ],
  'growth/knowledge-base': [
    {
      category: 'growth',
      moduleSlug: 'competency',
      label: 'Assess competency',
      rationale: 'Map what you learned to skill growth',
    },
    {
      category: 'growth',
      moduleSlug: 'hypothesis-board',
      label: 'Form a hypothesis',
      rationale: 'Turn a mental model into a testable bet',
    },
  ],
  'growth/hypothesis-board': [
    {
      category: 'analytics',
      moduleSlug: 'experiments',
      label: 'Design an experiment',
      rationale: 'Test the hypothesis rigorously',
    },
    {
      category: 'analytics',
      moduleSlug: 'ab-design',
      label: 'Design an A/B test',
      rationale: 'Run a controlled test of the claim',
    },
  ],
};

export function getNextSteps(category: string, moduleSlug: string): NextStep[] {
  return MODULE_FLOWS[`${category}/${moduleSlug}`] ?? [];
}
