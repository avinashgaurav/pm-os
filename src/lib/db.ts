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

const db = new Dexie('PMOS_v2') as Dexie & {
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

export { db };
