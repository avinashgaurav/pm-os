// Runtime validation schemas for everything that crosses a trust boundary:
// rows read from Dexie (older versions drift, local data can corrupt) and
// JSON returned by the /api/ai routes. One schema per Dexie table (17 total)
// + 3 AI API response schemas. Type-level guards at the bottom of this file
// fail tsc if a schema and its mirror TypeScript type drift apart.

import { z } from 'zod';
import type * as Types from '@/types';
import type { Usage } from '@/lib/providers/usage';
import type { Workflow, Preference, ModuleVisit } from '@/lib/db';

// ── Categorical helpers ──────────────────────────────────────────────────────
export const CategorySlugSchema = z.enum([
  'discovery',
  'strategy',
  'specs',
  'planning',
  'analytics',
  'competitive',
  'communication',
  'launch',
  'operations',
  'growth',
]);

// ── Core document (every PM-OS row that mirrors BaseDocument) ───────────────
export const BaseDocumentSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  category: CategorySlugSchema,
  moduleSlug: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
  tags: z.array(z.string()),
  starred: z.boolean(),
  archived: z.boolean(),
  // Flexible kv content — values are always strings, including the internal
  // `_output` / `_generatedOutput` markdown blobs.
  content: z.record(z.string(), z.string()),
});

// ── Discovery ───────────────────────────────────────────────────────────────
export const AssumptionSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  description: z.string(),
  status: z.enum(['untested', 'testing', 'validated', 'invalidated']),
  confidence: z.number(),
  impact: z.number(),
  evidence: z.array(z.string()),
  testPlan: z.string(),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const FeedbackItemSchema = z.object({
  id: z.string().min(1),
  content: z.string(),
  source: z.enum(['interview', 'survey', 'support', 'review', 'social', 'other']),
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  category: z.string(),
  customerName: z.string().optional(),
  tags: z.array(z.string()),
  votes: z.number(),
  createdAt: z.string(),
});

// ── Strategy ────────────────────────────────────────────────────────────────
export const DecisionOptionSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  effort: z.number(),
  impact: z.number(),
});

export const DecisionSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  context: z.string(),
  options: z.array(DecisionOptionSchema),
  chosenOptionId: z.string(),
  outcome: z.string(),
  status: z.enum(['pending', 'decided', 'revisiting']),
  stakeholders: z.array(z.string()),
  date: z.string(),
  tags: z.array(z.string()),
  linkedDocumentIds: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const FeatureScoreSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  description: z.string(),
  reach: z.number(),
  impact: z.number(),
  confidence: z.number(),
  effort: z.number(),
  riceScore: z.number(),
  iceImpact: z.number(),
  iceConfidence: z.number(),
  iceEase: z.number(),
  iceScore: z.number(),
  customScores: z.array(z.object({ dimension: z.string(), weight: z.number(), score: z.number() })),
  customTotal: z.number(),
  status: z.enum(['proposed', 'accepted', 'rejected', 'deferred']),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const RiskItemSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  description: z.string(),
  category: z.enum(['technical', 'market', 'operational', 'financial', 'legal', 'people']),
  severity: z.number(),
  likelihood: z.number(),
  riskScore: z.number(),
  mitigation: z.string(),
  owner: z.string(),
  status: z.enum(['open', 'mitigating', 'accepted', 'closed']),
  dueDate: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ── Planning ────────────────────────────────────────────────────────────────
export const SprintItemSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  points: z.number(),
  status: z.enum(['todo', 'in-progress', 'done']),
  assignee: z.string().optional(),
});

export const SprintSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  goal: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  velocity: z.number(),
  plannedPoints: z.number(),
  completedPoints: z.number(),
  items: z.array(SprintItemSchema),
  createdAt: z.string(),
});

export const ReleaseSchema = z.object({
  id: z.string().min(1),
  version: z.string(),
  name: z.string(),
  date: z.string(),
  status: z.enum(['planned', 'in-progress', 'released', 'rolled-back']),
  features: z.array(z.string()),
  notes: z.string(),
  createdAt: z.string(),
});

export const RoadmapItemSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  description: z.string(),
  quarter: z.string(),
  status: z.enum(['idea', 'planned', 'in-progress', 'shipped']),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  category: z.string(),
  dependencies: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ── Analytics ───────────────────────────────────────────────────────────────
export const KeyResultSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  current: z.number(),
  target: z.number(),
  unit: z.string(),
});

export const OKRSchema = z.object({
  id: z.string().min(1),
  objective: z.string(),
  quarter: z.string(),
  year: z.number(),
  progress: z.number(),
  keyResults: z.array(KeyResultSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ── Competitive ─────────────────────────────────────────────────────────────
export const CompetitorSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  website: z.string(),
  description: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  pricing: z.string(),
  positioning: z.string(),
  marketShare: z.string().optional(),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ── Communication ───────────────────────────────────────────────────────────
export const StakeholderSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  role: z.string(),
  influence: z.number(),
  interest: z.number(),
  strategy: z.string(),
  notes: z.string(),
  createdAt: z.string(),
});

export const ActionItemSchema = z.object({
  id: z.string().min(1),
  text: z.string(),
  assignee: z.string(),
  dueDate: z.string().optional(),
  done: z.boolean(),
});

export const MeetingNoteSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['one-on-one', 'sprint-review', 'stakeholder', 'all-hands', 'planning', 'other']),
  title: z.string(),
  date: z.string(),
  participants: z.array(z.string()),
  agenda: z.string(),
  notes: z.string(),
  actionItems: z.array(ActionItemSchema),
  tags: z.array(z.string()),
  createdAt: z.string(),
});

// ── Launch ──────────────────────────────────────────────────────────────────
export const ChangelogEntrySchema = z.object({
  id: z.string().min(1),
  version: z.string(),
  date: z.string(),
  type: z.enum(['feature', 'improvement', 'bugfix', 'breaking']),
  title: z.string(),
  description: z.string(),
  createdAt: z.string(),
});

// ── Growth ──────────────────────────────────────────────────────────────────
export const CompetencyScoreSchema = z.object({
  id: z.string().min(1),
  dimension: z.string(),
  score: z.number(),
  notes: z.string(),
  date: z.string(),
});

export const KnowledgeItemSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  category: z.enum(['framework', 'mental-model', 'book-summary', 'article', 'principle']),
  content: z.string(),
  source: z.string().optional(),
  tags: z.array(z.string()),
  createdAt: z.string(),
});

export const HypothesisSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  statement: z.string(),
  status: z.enum(['draft', 'testing', 'validated', 'invalidated']),
  metric: z.string(),
  baseline: z.string(),
  target: z.string(),
  experiment: z.string(),
  result: z.string().optional(),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ── Workflow (defined inside db.ts, not types/index.ts) ─────────────────────
export const WorkflowStepSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  description: z.string(),
  moduleLinks: z.array(z.string()),
  order: z.number(),
});

export const WorkflowSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  steps: z.array(WorkflowStepSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ── App-level key/value preferences (Dexie v2, added in #48) ──────────────
// `value` is intentionally `unknown` — different keys store different shapes
// (the cold-start wizard pref vs future onboarding flags). Per-key shape is
// validated separately at the consumer (e.g. ColdStartPreferenceSchema).
export const PreferenceSchema = z.object({
  key: z.string().min(1),
  value: z.unknown(),
  updatedAt: z.string(),
});

// ── Per-module visit counter (Dexie v3, added in #49) ─────────────────────
export const ModuleVisitSchema = z.object({
  slug: z.string().min(1),
  visits: z.number(),
  paletteSelections: z.number(),
  lastVisitedAt: z.string(),
});

// ── AI API responses ────────────────────────────────────────────────────────
// /api/ai POST success: { output, provider, model, usage }
export const UsageSchema = z.object({
  inputTokens: z.number(),
  outputTokens: z.number(),
  totalTokens: z.number(),
  estimatedCostUsd: z.number(),
  provider: z.string(),
  model: z.string(),
});

export const AIGenerateResponseSchema = z.object({
  output: z.string(),
  provider: z.string(),
  model: z.string(),
  usage: UsageSchema.optional(),
});

// Any /api/ai* failure response: { error: string, kind?: AIErrorKind, provider?: string }
export const AIErrorResponseSchema = z.object({
  error: z.string(),
  kind: z.enum(['network', 'rate_limit', 'auth', 'model', 'server', 'aborted']).optional(),
  provider: z.string().optional(),
});

// /api/ai GET providers list
export const ProvidersListResponseSchema = z.object({
  providers: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      models: z.array(z.string()),
      defaultModel: z.string(),
      docs: z.string(),
      configured: z.boolean(),
    })
  ),
});

// ── Schema/type drift guards ────────────────────────────────────────────────
// Each AssertEquals<A, B> below resolves to `true` only when the Zod-inferred
// type matches the TypeScript interface exactly. If you change a type in
// src/types/index.ts without updating the schema (or vice versa), tsc will
// fail on the matching line. Free safety net; compile-time only.
type AssertEquals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : never;
// Each statement below is `true` if the pair matches, `never` if they drift.
// Bound to a `true` annotation so drift produces a clear "Type 'never' is not
// assignable to 'true'" tsc error.
const _checkBaseDocument: AssertEquals<
  z.infer<typeof BaseDocumentSchema>,
  Types.BaseDocument
> = true;
const _checkAssumption: AssertEquals<z.infer<typeof AssumptionSchema>, Types.Assumption> = true;
const _checkFeedback: AssertEquals<z.infer<typeof FeedbackItemSchema>, Types.FeedbackItem> = true;
const _checkDecision: AssertEquals<z.infer<typeof DecisionSchema>, Types.Decision> = true;
const _checkFeatureScore: AssertEquals<
  z.infer<typeof FeatureScoreSchema>,
  Types.FeatureScore
> = true;
const _checkRiskItem: AssertEquals<z.infer<typeof RiskItemSchema>, Types.RiskItem> = true;
const _checkSprint: AssertEquals<z.infer<typeof SprintSchema>, Types.Sprint> = true;
const _checkRelease: AssertEquals<z.infer<typeof ReleaseSchema>, Types.Release> = true;
const _checkRoadmapItem: AssertEquals<z.infer<typeof RoadmapItemSchema>, Types.RoadmapItem> = true;
const _checkOKR: AssertEquals<z.infer<typeof OKRSchema>, Types.OKR> = true;
const _checkCompetitor: AssertEquals<z.infer<typeof CompetitorSchema>, Types.Competitor> = true;
const _checkStakeholder: AssertEquals<z.infer<typeof StakeholderSchema>, Types.Stakeholder> = true;
const _checkMeetingNote: AssertEquals<z.infer<typeof MeetingNoteSchema>, Types.MeetingNote> = true;
const _checkChangelogEntry: AssertEquals<
  z.infer<typeof ChangelogEntrySchema>,
  Types.ChangelogEntry
> = true;
const _checkCompetencyScore: AssertEquals<
  z.infer<typeof CompetencyScoreSchema>,
  Types.CompetencyScore
> = true;
const _checkKnowledgeItem: AssertEquals<
  z.infer<typeof KnowledgeItemSchema>,
  Types.KnowledgeItem
> = true;
const _checkHypothesis: AssertEquals<z.infer<typeof HypothesisSchema>, Types.Hypothesis> = true;
const _checkUsage: AssertEquals<z.infer<typeof UsageSchema>, Usage> = true;
const _checkWorkflow: AssertEquals<z.infer<typeof WorkflowSchema>, Workflow> = true;
const _checkPreference: AssertEquals<z.infer<typeof PreferenceSchema>, Preference> = true;
const _checkModuleVisit: AssertEquals<z.infer<typeof ModuleVisitSchema>, ModuleVisit> = true;
void _checkBaseDocument;
void _checkAssumption;
void _checkFeedback;
void _checkDecision;
void _checkFeatureScore;
void _checkRiskItem;
void _checkSprint;
void _checkRelease;
void _checkRoadmapItem;
void _checkOKR;
void _checkCompetitor;
void _checkStakeholder;
void _checkMeetingNote;
void _checkChangelogEntry;
void _checkCompetencyScore;
void _checkKnowledgeItem;
void _checkHypothesis;
void _checkUsage;
void _checkWorkflow;
void _checkPreference;
void _checkModuleVisit;
