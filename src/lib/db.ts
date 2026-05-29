import Dexie, { type EntityTable } from 'dexie';
import type {
  BaseDocument,
  Assumption,
  FeedbackItem,
  Decision,
  FeatureScore,
  RiskItem,
  OKR,
  Sprint,
  Release,
  RoadmapItem,
  Competitor,
  Stakeholder,
  MeetingNote,
  ChangelogEntry,
  CompetencyScore,
  KnowledgeItem,
  Hypothesis,
} from '@/types';

export interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  moduleLinks: string[];
  order: number;
}

export interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
}

// Key-value bucket for app-level preferences (cold-start wizard answers,
// future onboarding flags, anything that isn't a per-entity row). Use
// stable string keys like 'cold_start_v1' so we can version state without
// schema migrations.
export interface Preference {
  key: string;
  value: unknown;
  updatedAt: string;
}

// Per-module visit counter — powers Recent + Frequent in the command palette
// and the "Pick up where you left off" row on home. `slug` is the canonical
// "category/moduleSlug" key. `visits` is the total; `paletteSelections` is the
// palette-only subset (the `source` argument to recordVisit decides which
// counter increments — it is not stored as a column).
export interface ModuleVisit {
  slug: string; // e.g. "specs/prd"
  visits: number;
  paletteSelections: number;
  lastVisitedAt: string;
}

const db = new Dexie('PMOS_v2') as Dexie & {
  workflows: EntityTable<Workflow, 'id'>;
  preferences: EntityTable<Preference, 'key'>;
  moduleVisits: EntityTable<ModuleVisit, 'slug'>;
  documents: EntityTable<BaseDocument, 'id'>;
  assumptions: EntityTable<Assumption, 'id'>;
  feedbackItems: EntityTable<FeedbackItem, 'id'>;
  decisions: EntityTable<Decision, 'id'>;
  featureScores: EntityTable<FeatureScore, 'id'>;
  risks: EntityTable<RiskItem, 'id'>;
  okrs: EntityTable<OKR, 'id'>;
  sprints: EntityTable<Sprint, 'id'>;
  releases: EntityTable<Release, 'id'>;
  roadmapItems: EntityTable<RoadmapItem, 'id'>;
  competitors: EntityTable<Competitor, 'id'>;
  stakeholders: EntityTable<Stakeholder, 'id'>;
  meetingNotes: EntityTable<MeetingNote, 'id'>;
  changelogEntries: EntityTable<ChangelogEntry, 'id'>;
  competencyScores: EntityTable<CompetencyScore, 'id'>;
  knowledgeItems: EntityTable<KnowledgeItem, 'id'>;
  hypotheses: EntityTable<Hypothesis, 'id'>;
};

db.version(1).stores({
  workflows: 'id, name, createdAt',
  documents: 'id, category, moduleSlug, createdAt, updatedAt, starred, *tags',
  assumptions: 'id, status, createdAt',
  feedbackItems: 'id, source, sentiment, createdAt',
  decisions: 'id, status, createdAt',
  featureScores: 'id, status, createdAt',
  risks: 'id, status, createdAt',
  okrs: 'id, createdAt',
  sprints: 'id, createdAt',
  releases: 'id, date, createdAt',
  roadmapItems: 'id, createdAt',
  competitors: 'id, createdAt',
  stakeholders: 'id, createdAt',
  meetingNotes: 'id, createdAt',
  changelogEntries: 'id, date, createdAt',
  competencyScores: 'id, dimension, date',
  knowledgeItems: 'id, category, createdAt',
  hypotheses: 'id, status, createdAt',
});

// v2: add `preferences` key/value store for app-level flags (cold-start
// wizard answers, onboarding state). Additive — older browsers just see an
// empty preferences table.
db.version(2).stores({
  preferences: 'key, updatedAt',
});

// v3: add `moduleVisits` for the Recent/Frequent surfacing. Additive — no
// data migration. (Lands after #48's v2 preferences table.)
db.version(3).stores({
  moduleVisits: 'slug, visits, lastVisitedAt',
});

// Lazy-load Sentry only in the browser to keep the server bundle clean.
if (typeof window !== 'undefined') {
  void import('@sentry/nextjs').then(({ captureException, captureMessage }) => {
    db.on('blocked', () => {
      captureMessage('Dexie open blocked — another tab holds the DB', { level: 'warning' });
    });
    db.on('versionchange', () => {
      captureMessage('Dexie versionchange fired — schema upgrade requested', { level: 'info' });
    });
    db.open().catch((err: unknown) => {
      captureException(err, { tags: { area: 'dexie', op: 'open' } });
    });
  });
}

export { db };
