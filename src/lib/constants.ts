import type { CategoryConfig } from '@/types';

export const APP_NAME = 'PM OS';
export const APP_DESCRIPTION = 'The Product Management Operating System';

export const categories: CategoryConfig[] = [
  {
    slug: 'discovery',
    name: 'Discovery',
    description: 'Understand your users, validate assumptions, and uncover insights',
    icon: 'Search',
    color: '#6366f1',
    modules: [
      { slug: 'interviews', name: 'Interview Analyzer', description: 'Analyze and synthesize user interview transcripts', icon: 'Mic', archetype: 'document' },
      { slug: 'synthesis', name: 'Research Synthesis', description: 'Synthesize research findings into actionable insights', icon: 'FlaskConical', archetype: 'document' },
      { slug: 'personas', name: 'Persona Generator', description: 'Create detailed user personas from research data', icon: 'UserCircle', archetype: 'document' },
      { slug: 'jtbd', name: 'JTBD Extractor', description: 'Extract Jobs-to-be-Done statements from research', icon: 'Target', archetype: 'document' },
      { slug: 'journey-map', name: 'Journey Map', description: 'Map the end-to-end customer experience', icon: 'Route', archetype: 'canvas' },
      { slug: 'feedback', name: 'Feedback Categorizer', description: 'Categorize and prioritize user feedback', icon: 'MessageSquare', archetype: 'document' },
      { slug: 'surveys', name: 'Survey Generator', description: 'Design effective survey questions', icon: 'ClipboardList', archetype: 'document' },
      { slug: 'app-reviews', name: 'App Review Analyzer', description: 'Analyze app store reviews for insights', icon: 'Star', archetype: 'document' },
      { slug: 'feature-requests', name: 'Feature Requests', description: 'Track and analyze feature request patterns', icon: 'Lightbulb', archetype: 'document' },
      { slug: 'customer-voice', name: 'Customer Voice', description: 'Aggregate voice-of-customer data', icon: 'AudioLines', archetype: 'document' },
      { slug: 'feedback-wall', name: 'Feedback Wall', description: 'Visual wall of customer feedback with sentiment tags', icon: 'LayoutGrid', archetype: 'tracker' },
      { slug: 'assumptions', name: 'Assumption Tracker', description: 'Track and validate product assumptions', icon: 'HelpCircle', archetype: 'tracker' },
    ],
  },
  {
    slug: 'strategy',
    name: 'Strategy',
    description: 'Define positioning, set objectives, and make strategic decisions',
    icon: 'Compass',
    color: '#a855f7',
    modules: [
      { slug: 'positioning', name: 'Positioning', description: 'Define product positioning (April Dunford framework)', icon: 'Crosshair', archetype: 'document' },
      { slug: 'gtm', name: 'GTM Strategy', description: 'Plan your go-to-market strategy', icon: 'Rocket', archetype: 'document' },
      { slug: 'okrs', name: 'OKR Coach', description: 'Craft effective OKRs for your team', icon: 'Trophy', archetype: 'document' },
      { slug: 'swot', name: 'SWOT Analysis', description: 'Analyze strengths, weaknesses, opportunities, threats', icon: 'Grid2x2', archetype: 'canvas' },
      { slug: 'bcg-matrix', name: 'BCG Matrix', description: 'Portfolio analysis with BCG growth-share matrix', icon: 'PieChart', archetype: 'canvas' },
      { slug: 'north-star', name: 'North Star', description: 'Define your north star metric and strategy', icon: 'Sparkles', archetype: 'document' },
      { slug: 'ost', name: 'Opportunity Solution Tree', description: 'Map outcomes to opportunities to solutions (Teresa Torres)', icon: 'GitBranch', archetype: 'canvas' },
      { slug: 'vpc', name: 'Value Prop Canvas', description: 'Define your value proposition canvas', icon: 'Heart', archetype: 'document' },
      { slug: 'risk-register', name: 'Risk Register', description: 'Track and manage product risks', icon: 'ShieldAlert', archetype: 'tracker' },
      { slug: 'build-vs-buy', name: 'Build vs Buy', description: 'Evaluate build vs buy decisions', icon: 'Scale', archetype: 'document' },
      { slug: 'ai-strategy', name: 'AI Strategy', description: 'Plan AI/ML integration strategy for your product', icon: 'Brain', archetype: 'document' },
      { slug: 'pricing', name: 'Pricing Strategy', description: 'Analyze and plan your pricing model', icon: 'DollarSign', archetype: 'document' },
      { slug: 'roadmap-review', name: 'Roadmap Review', description: 'Strategic review of your product roadmap', icon: 'Map', archetype: 'document' },
      { slug: 'devils-advocate', name: "Devil's Advocate", description: 'Challenge your strategy with contrarian thinking', icon: 'Flame', archetype: 'document' },
      { slug: 'metric-tree', name: 'Metric Tree', description: 'Visual north star metric decomposition tree', icon: 'Network', archetype: 'canvas' },
      { slug: 'vision-board', name: 'Vision Board', description: 'Create a structured product vision board', icon: 'Presentation', archetype: 'canvas' },
      { slug: 'decisions', name: 'Decision Log', description: 'Track all product decisions with context and outcomes', icon: 'Gavel', archetype: 'tracker' },
      { slug: 'scoring', name: 'Feature Scoring', description: 'Score features using RICE, ICE, or custom frameworks', icon: 'Calculator', archetype: 'tracker' },
    ],
  },
  {
    slug: 'specs',
    name: 'Specs',
    description: 'Write PRDs, user stories, and technical specifications',
    icon: 'FileText',
    color: '#22d3ee',
    modules: [
      { slug: 'prd', name: 'PRD Generator', description: 'Create comprehensive Product Requirements Documents', icon: 'FileText', archetype: 'document' },
      { slug: 'user-stories', name: 'User Stories', description: 'Write user stories with acceptance criteria', icon: 'BookOpen', archetype: 'document' },
      { slug: 'brief', name: 'Product Brief', description: 'Write concise product briefs for stakeholders', icon: 'FileCheck', archetype: 'document' },
      { slug: 'one-pager', name: 'One-Pager', description: 'Create executive one-page product summaries', icon: 'File', archetype: 'document' },
      { slug: 'tech-spec', name: 'Technical Spec', description: 'Write detailed technical specifications', icon: 'Code', archetype: 'document' },
      { slug: 'api-docs', name: 'API Documentation', description: 'Generate API documentation from specs', icon: 'Braces', archetype: 'document' },
      { slug: 'onboarding', name: 'Onboarding Flow', description: 'Design user onboarding flows', icon: 'Footprints', archetype: 'document' },
      { slug: 'story-map', name: 'User Story Map', description: 'Visual story mapping with activities and stories', icon: 'LayoutDashboard', archetype: 'canvas' },
    ],
  },
  {
    slug: 'planning',
    name: 'Planning',
    description: 'Build roadmaps, plan sprints, and manage releases',
    icon: 'Calendar',
    color: '#10b981',
    modules: [
      { slug: 'roadmap', name: 'Roadmap Builder', description: 'Build and visualize your product roadmap', icon: 'Map', archetype: 'document' },
      { slug: 'quarterly', name: 'Quarterly Planning', description: 'Plan and align on quarterly goals', icon: 'CalendarDays', archetype: 'document' },
      { slug: 'sprints', name: 'Sprint Planning', description: 'Plan and manage sprint cycles', icon: 'Timer', archetype: 'document' },
      { slug: 'decomposition', name: 'Feature Decomposition', description: 'Break features into shippable increments', icon: 'Layers', archetype: 'document' },
      { slug: 'backlog', name: 'Backlog Prioritizer', description: 'Prioritize and manage your product backlog', icon: 'ListOrdered', archetype: 'tracker' },
      { slug: 'daily', name: 'Daily Plan', description: 'Structure your daily PM priorities', icon: 'Sun', archetype: 'document' },
      { slug: 'weekly', name: 'Weekly Plan', description: 'Plan your weekly PM activities', icon: 'CalendarRange', archetype: 'document' },
      { slug: 'release-calendar', name: 'Release Calendar', description: 'Manage release timelines and milestones', icon: 'CalendarCheck', archetype: 'tracker' },
      { slug: 'velocity', name: 'Sprint Velocity', description: 'Track sprint velocity over time', icon: 'TrendingUp', archetype: 'tracker' },
      { slug: 'dependencies', name: 'Dependency Map', description: 'Visualize feature and team dependencies', icon: 'Workflow', archetype: 'canvas' },
    ],
  },
  {
    slug: 'analytics',
    name: 'Analytics',
    description: 'Design metrics, analyze experiments, and track OKRs',
    icon: 'BarChart3',
    color: '#f59e0b',
    modules: [
      { slug: 'metrics', name: 'Metric Framework', description: 'Design your AARRR/pirate metrics framework', icon: 'Activity', archetype: 'document' },
      { slug: 'ab-design', name: 'A/B Test Designer', description: 'Design statistically valid A/B tests', icon: 'FlipHorizontal', archetype: 'document' },
      { slug: 'ab-analysis', name: 'A/B Test Analyzer', description: 'Analyze A/B test results for significance', icon: 'BarChart', archetype: 'document' },
      { slug: 'funnels', name: 'Funnel Analyzer', description: 'Analyze conversion funnels and drop-offs', icon: 'Filter', archetype: 'document' },
      { slug: 'experiments', name: 'Experiment Designer', description: 'Design product experiments with clear hypotheses', icon: 'FlaskRound', archetype: 'document' },
      { slug: 'dashboards', name: 'Dashboard Designer', description: 'Design product analytics dashboards', icon: 'LayoutDashboard', archetype: 'document' },
      { slug: 'okr-tracker', name: 'OKR Tracker', description: 'Track OKR progress with visual indicators', icon: 'Target', archetype: 'tracker' },
    ],
  },
  {
    slug: 'competitive',
    name: 'Competitive',
    description: 'Analyze competitors, size markets, and track wins/losses',
    icon: 'Swords',
    color: '#ef4444',
    modules: [
      { slug: 'profiles', name: 'Competitor Profiler', description: 'Create detailed competitor profiles', icon: 'Users', archetype: 'document' },
      { slug: 'landscape', name: 'Landscape Mapper', description: 'Map the competitive landscape on key dimensions', icon: 'Map', archetype: 'canvas' },
      { slug: 'market-sizing', name: 'Market Sizing', description: 'Calculate TAM, SAM, SOM for your market', icon: 'Globe', archetype: 'document' },
      { slug: 'win-loss', name: 'Win/Loss Analysis', description: 'Analyze competitive wins and losses', icon: 'TrendingDown', archetype: 'document' },
      { slug: 'impact-effort', name: 'Impact vs Effort', description: 'Interactive 2x2 prioritization matrix', icon: 'Maximize2', archetype: 'canvas' },
    ],
  },
  {
    slug: 'communication',
    name: 'Communication',
    description: 'Craft updates, manage stakeholders, and run meetings',
    icon: 'MessageCircle',
    color: '#ec4899',
    modules: [
      { slug: 'release-notes', name: 'Release Notes', description: 'Write clear and engaging release notes', icon: 'FileEdit', archetype: 'document' },
      { slug: 'exec-update', name: 'Executive Update', description: 'Write executive updates using SCQA framework', icon: 'Presentation', archetype: 'document' },
      { slug: 'stakeholder-sim', name: 'Stakeholder Simulator', description: 'Simulate stakeholder reactions to decisions', icon: 'Drama', archetype: 'document' },
      { slug: 'meeting-notes', name: 'Meeting Notes', description: 'Structured meeting notes with action items', icon: 'NotebookPen', archetype: 'document' },
      { slug: 'decision-doc', name: 'Decision Document', description: 'Write decision documents for alignment', icon: 'FileCheck2', archetype: 'document' },
      { slug: 'board-deck', name: 'Board Deck', description: 'Create board meeting presentation outlines', icon: 'GalleryHorizontalEnd', archetype: 'document' },
      { slug: 'agenda', name: 'Meeting Agenda', description: 'Create structured meeting agendas', icon: 'ListChecks', archetype: 'document' },
      { slug: 'stakeholder-map', name: 'Stakeholder Map', description: 'Map stakeholders by influence and interest', icon: 'Users2', archetype: 'canvas' },
    ],
  },
  {
    slug: 'launch',
    name: 'Launch',
    description: 'Plan launches, create checklists, and enable sales',
    icon: 'Rocket',
    color: '#f97316',
    modules: [
      { slug: 'announcement', name: 'Announcement', description: 'Write customer-facing product announcements', icon: 'Megaphone', archetype: 'document' },
      { slug: 'checklist', name: 'Launch Checklist', description: 'Build comprehensive launch checklists', icon: 'CheckSquare', archetype: 'document' },
      { slug: 'sales-enablement', name: 'Sales Enablement', description: 'Create sales enablement materials', icon: 'Briefcase', archetype: 'document' },
      { slug: 'readiness', name: 'Launch Readiness', description: 'Assess launch readiness across all teams', icon: 'ShieldCheck', archetype: 'document' },
      { slug: 'changelog', name: 'Product Changelog', description: 'Generate beautiful product changelogs', icon: 'History', archetype: 'tracker' },
    ],
  },
  {
    slug: 'operations',
    name: 'Operations',
    description: 'Run retros, post-mortems, and team health checks',
    icon: 'Settings',
    color: '#8b5cf6',
    modules: [
      { slug: 'retro', name: 'Sprint Retro', description: 'Run effective sprint retrospectives', icon: 'RotateCcw', archetype: 'document' },
      { slug: 'team-health', name: 'Team Health Check', description: 'Assess team health across key dimensions', icon: 'HeartPulse', archetype: 'tracker' },
      { slug: 'processes', name: 'Process Docs', description: 'Document team processes and workflows', icon: 'BookMarked', archetype: 'document' },
      { slug: 'post-mortem', name: 'Post-Mortem', description: 'Conduct blameless post-mortem reviews', icon: 'AlertTriangle', archetype: 'document' },
      { slug: 'cs-playbook', name: 'CS Playbook', description: 'Build customer success playbooks', icon: 'HandShake', archetype: 'document' },
      { slug: 'meeting-templates', name: 'Meeting Templates', description: 'Pre-built meeting templates (1:1, sprint review, etc.)', icon: 'LayoutTemplate', archetype: 'document' },
    ],
  },
  {
    slug: 'growth',
    name: 'Growth',
    description: 'Track your PM growth, build knowledge, and test hypotheses',
    icon: 'Sprout',
    color: '#14b8a6',
    modules: [
      { slug: 'competency', name: 'PM Competency', description: 'Assess and track your PM skill development', icon: 'Radar', archetype: 'tracker' },
      { slug: 'knowledge-base', name: 'Knowledge Base', description: 'PM frameworks, mental models, and book summaries', icon: 'Library', archetype: 'tracker' },
      { slug: 'hypothesis-board', name: 'Hypothesis Board', description: 'Track product hypotheses and experiments', icon: 'Beaker', archetype: 'tracker' },
    ],
  },
];

export function getCategory(slug: string): CategoryConfig | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getModule(categorySlug: string, moduleSlug: string) {
  const cat = getCategory(categorySlug);
  return cat?.modules.find((m) => m.slug === moduleSlug);
}

export function getAllModules() {
  return categories.flatMap((c) =>
    c.modules.map((m) => ({ ...m, category: c.slug, categoryName: c.name, color: c.color }))
  );
}
