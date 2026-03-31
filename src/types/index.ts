// ============================================================
// PM OS — Core Type Definitions
// ============================================================

// --- Base ---
export interface BaseDocument {
  id: string;
  title: string;
  category: CategorySlug;
  moduleSlug: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  starred: boolean;
  archived: boolean;
  content: Record<string, string>; // flexible key-value for form sections
}

export type CategorySlug =
  | 'discovery'
  | 'strategy'
  | 'specs'
  | 'planning'
  | 'analytics'
  | 'competitive'
  | 'communication'
  | 'launch'
  | 'operations'
  | 'growth';

// --- Discovery ---
export interface Persona extends BaseDocument {
  name: string;
  role: string;
  demographics: { age: string; location: string; experience: string };
  goals: string[];
  painPoints: string[];
  behaviors: string[];
  jtbdStatements: string[];
  quote: string;
}

export interface Assumption {
  id: string;
  title: string;
  description: string;
  status: 'untested' | 'testing' | 'validated' | 'invalidated';
  confidence: number;
  impact: number;
  evidence: string[];
  testPlan: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackItem {
  id: string;
  content: string;
  source: 'interview' | 'survey' | 'support' | 'review' | 'social' | 'other';
  sentiment: 'positive' | 'neutral' | 'negative';
  category: string;
  customerName?: string;
  tags: string[];
  votes: number;
  createdAt: string;
}

// --- Strategy ---
export interface Decision {
  id: string;
  title: string;
  context: string;
  options: DecisionOption[];
  chosenOptionId: string;
  outcome: string;
  status: 'pending' | 'decided' | 'revisiting';
  stakeholders: string[];
  date: string;
  tags: string[];
  linkedDocumentIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DecisionOption {
  id: string;
  title: string;
  pros: string[];
  cons: string[];
  effort: number;
  impact: number;
}

export interface FeatureScore {
  id: string;
  title: string;
  description: string;
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  riceScore: number;
  iceImpact: number;
  iceConfidence: number;
  iceEase: number;
  iceScore: number;
  customScores: { dimension: string; weight: number; score: number }[];
  customTotal: number;
  status: 'proposed' | 'accepted' | 'rejected' | 'deferred';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RiskItem {
  id: string;
  title: string;
  description: string;
  category: 'technical' | 'market' | 'operational' | 'financial' | 'legal' | 'people';
  severity: number;
  likelihood: number;
  riskScore: number;
  mitigation: string;
  owner: string;
  status: 'open' | 'mitigating' | 'accepted' | 'closed';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MetricTreeNode {
  id: string;
  label: string;
  value?: string;
  parentId: string | null;
  type: 'north-star' | 'input-metric' | 'lever' | 'initiative';
  x: number;
  y: number;
}

// --- Planning ---
export interface Sprint {
  id: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  velocity: number;
  plannedPoints: number;
  completedPoints: number;
  items: SprintItem[];
  createdAt: string;
}

export interface SprintItem {
  id: string;
  title: string;
  points: number;
  status: 'todo' | 'in-progress' | 'done';
  assignee?: string;
}

export interface Release {
  id: string;
  version: string;
  name: string;
  date: string;
  status: 'planned' | 'in-progress' | 'released' | 'rolled-back';
  features: string[];
  notes: string;
  createdAt: string;
}

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  quarter: string;
  status: 'idea' | 'planned' | 'in-progress' | 'shipped';
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  dependencies: string[];
  createdAt: string;
  updatedAt: string;
}

// --- Analytics ---
export interface OKR {
  id: string;
  objective: string;
  quarter: string;
  year: number;
  progress: number;
  keyResults: KeyResult[];
  createdAt: string;
  updatedAt: string;
}

export interface KeyResult {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
}

// --- Competitive ---
export interface Competitor {
  id: string;
  name: string;
  website: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  pricing: string;
  positioning: string;
  marketShare?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// --- Communication ---
export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  influence: number;
  interest: number;
  strategy: string;
  notes: string;
  createdAt: string;
}

export interface MeetingNote {
  id: string;
  type: 'one-on-one' | 'sprint-review' | 'stakeholder' | 'all-hands' | 'planning' | 'other';
  title: string;
  date: string;
  participants: string[];
  agenda: string;
  notes: string;
  actionItems: ActionItem[];
  tags: string[];
  createdAt: string;
}

export interface ActionItem {
  id: string;
  text: string;
  assignee: string;
  dueDate?: string;
  done: boolean;
}

// --- Launch ---
export interface ChangelogEntry {
  id: string;
  version: string;
  date: string;
  type: 'feature' | 'improvement' | 'bugfix' | 'breaking';
  title: string;
  description: string;
  createdAt: string;
}

// --- Growth ---
export interface CompetencyScore {
  id: string;
  dimension: string;
  score: number;
  notes: string;
  date: string;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  category: 'framework' | 'mental-model' | 'book-summary' | 'article' | 'principle';
  content: string;
  source?: string;
  tags: string[];
  createdAt: string;
}

export interface Hypothesis {
  id: string;
  title: string;
  statement: string;
  status: 'draft' | 'testing' | 'validated' | 'invalidated';
  metric: string;
  baseline: string;
  target: string;
  experiment: string;
  result?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// --- Navigation ---
export interface ModuleConfig {
  slug: string;
  name: string;
  description: string;
  icon: string;
  archetype: 'document' | 'canvas' | 'tracker';
  isNew?: boolean;
}

export interface CategoryConfig {
  slug: CategorySlug;
  name: string;
  description: string;
  icon: string;
  color: string;
  modules: ModuleConfig[];
}

// --- Template ---
export interface TemplateSection {
  key: string;
  label: string;
  placeholder: string;
  type: 'text' | 'textarea' | 'select' | 'tags';
  options?: string[];
  required?: boolean;
}

export interface ModuleTemplate {
  moduleSlug: string;
  category: CategorySlug;
  sections: TemplateSection[];
}
