import Dexie, { type EntityTable } from 'dexie';
import type {
  BaseDocument, Assumption, FeedbackItem, Decision, FeatureScore,
  RiskItem, OKR, Sprint, Release, RoadmapItem, Competitor, Stakeholder,
  MeetingNote, ChangelogEntry, CompetencyScore, KnowledgeItem, Hypothesis,
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

const db = new Dexie('PMOperatingSystem') as Dexie & {
  workflows: EntityTable<Workflow, 'id'>;
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

db.version(3).stores({
  workflows: 'id, name, createdAt',
  documents: 'id, category, moduleSlug, title, createdAt, updatedAt, starred, archived, *tags',
  assumptions: 'id, status, confidence, *tags, createdAt',
  feedbackItems: 'id, source, sentiment, category, *tags, createdAt',
  decisions: 'id, status, date, *tags, createdAt',
  featureScores: 'id, riceScore, iceScore, status, *tags, createdAt',
  risks: 'id, severity, likelihood, status, createdAt',
  okrs: 'id, quarter, year, createdAt',
  sprints: 'id, startDate, endDate, createdAt',
  releases: 'id, version, date, status, createdAt',
  roadmapItems: 'id, quarter, status, priority, createdAt',
  competitors: 'id, name, *tags, createdAt',
  stakeholders: 'id, name, influence, interest, createdAt',
  meetingNotes: 'id, type, date, *tags, createdAt',
  changelogEntries: 'id, version, date, type, createdAt',
  competencyScores: 'id, dimension, date',
  knowledgeItems: 'id, category, *tags, createdAt',
  hypotheses: 'id, status, *tags, createdAt',
});

// Handle schema upgrade failures by deleting and recreating
if (typeof window !== "undefined") db.open().catch(async (err) => {
  console.warn('DB open failed, resetting:', err.message);
  await Dexie.delete('PMOperatingSystem');
  window.location.reload();
});

export { db };
