import type { ModuleTemplate } from '@/types';
import { prdTemplate } from './prd-template';

// Generic templates for all document generator modules
const templates: Record<string, ModuleTemplate> = {
  // === SPECS ===
  'specs/prd': prdTemplate,
  'specs/user-stories': {
    moduleSlug: 'user-stories', category: 'specs',
    sections: [
      { key: 'epic', label: 'Epic / Feature', placeholder: 'What is the high-level feature this story belongs to?', type: 'textarea', required: true },
      { key: 'stories', label: 'User Stories', placeholder: 'As a [user], I want [capability] so that [benefit].\n\nWrite one story per line.', type: 'textarea', required: true },
      { key: 'acceptanceCriteria', label: 'Acceptance Criteria', placeholder: 'Given [context], when [action], then [outcome].\n\nList all criteria that must be met.', type: 'textarea', required: true },
      { key: 'edgeCases', label: 'Edge Cases', placeholder: 'What edge cases should be handled? Error states? Empty states?', type: 'textarea' },
      { key: 'dependencies', label: 'Dependencies', placeholder: 'What APIs, services, or features does this depend on?', type: 'textarea' },
      { key: 'designNotes', label: 'Design Notes', placeholder: 'UI/UX considerations, wireframe references, accessibility requirements.', type: 'textarea' },
    ],
  },
  'specs/brief': {
    moduleSlug: 'brief', category: 'specs',
    sections: [
      { key: 'overview', label: 'Overview', placeholder: 'One paragraph summary of the product/feature.', type: 'textarea', required: true },
      { key: 'problem', label: 'Problem', placeholder: 'What problem does this solve?', type: 'textarea', required: true },
      { key: 'solution', label: 'Solution', placeholder: 'What is our proposed approach?', type: 'textarea', required: true },
      { key: 'audience', label: 'Target Audience', placeholder: 'Who is this for?', type: 'textarea' },
      { key: 'successMetrics', label: 'Success Metrics', placeholder: 'How will we measure success?', type: 'textarea' },
      { key: 'timeline', label: 'Timeline', placeholder: 'Expected timeline and key milestones.', type: 'textarea' },
    ],
  },
  'specs/one-pager': {
    moduleSlug: 'one-pager', category: 'specs',
    sections: [
      { key: 'tldr', label: 'TL;DR', placeholder: 'One sentence summary.', type: 'textarea', required: true },
      { key: 'context', label: 'Context', placeholder: 'Why now? What has changed?', type: 'textarea', required: true },
      { key: 'proposal', label: 'Proposal', placeholder: 'What exactly are we proposing?', type: 'textarea', required: true },
      { key: 'impact', label: 'Expected Impact', placeholder: 'What outcomes do we expect?', type: 'textarea' },
      { key: 'ask', label: 'The Ask', placeholder: 'What do you need from the reader? Approval? Resources? Feedback?', type: 'textarea' },
    ],
  },
  'specs/tech-spec': {
    moduleSlug: 'tech-spec', category: 'specs',
    sections: [
      { key: 'overview', label: 'Technical Overview', placeholder: 'High-level architecture and approach.', type: 'textarea', required: true },
      { key: 'systemDesign', label: 'System Design', placeholder: 'Components, services, data flow, APIs.', type: 'textarea', required: true },
      { key: 'dataModel', label: 'Data Model', placeholder: 'Database schema, entities, relationships.', type: 'textarea' },
      { key: 'apis', label: 'API Design', placeholder: 'Endpoints, request/response formats, authentication.', type: 'textarea' },
      { key: 'security', label: 'Security Considerations', placeholder: 'Authentication, authorization, data protection.', type: 'textarea' },
      { key: 'performance', label: 'Performance', placeholder: 'Expected load, latency targets, scalability.', type: 'textarea' },
      { key: 'testing', label: 'Testing Strategy', placeholder: 'Unit, integration, E2E testing approach.', type: 'textarea' },
      { key: 'rollout', label: 'Rollout Plan', placeholder: 'Feature flags, staged rollout, rollback plan.', type: 'textarea' },
    ],
  },
  'specs/api-docs': {
    moduleSlug: 'api-docs', category: 'specs',
    sections: [
      { key: 'overview', label: 'API Overview', placeholder: 'What does this API do? Base URL, versioning, authentication.', type: 'textarea', required: true },
      { key: 'endpoints', label: 'Endpoints', placeholder: 'List all endpoints with methods, paths, params, and responses.', type: 'textarea', required: true },
      { key: 'authentication', label: 'Authentication', placeholder: 'How to authenticate. API keys, OAuth, JWT, etc.', type: 'textarea' },
      { key: 'errors', label: 'Error Codes', placeholder: 'Common error codes and their meanings.', type: 'textarea' },
      { key: 'examples', label: 'Usage Examples', placeholder: 'Code examples for common use cases.', type: 'textarea' },
      { key: 'rateLimit', label: 'Rate Limiting', placeholder: 'Rate limit policies and headers.', type: 'textarea' },
    ],
  },
  'specs/onboarding': {
    moduleSlug: 'onboarding', category: 'specs',
    sections: [
      { key: 'goals', label: 'Onboarding Goals', placeholder: 'What should users accomplish during onboarding?', type: 'textarea', required: true },
      { key: 'steps', label: 'Onboarding Steps', placeholder: 'Step-by-step flow from signup to first value moment.', type: 'textarea', required: true },
      { key: 'activation', label: 'Activation Metric', placeholder: 'What defines an "activated" user?', type: 'textarea' },
      { key: 'dropoff', label: 'Drop-off Points', placeholder: 'Where might users drop off? Mitigation strategies?', type: 'textarea' },
      { key: 'personalization', label: 'Personalization', placeholder: 'How does onboarding adapt to different user segments?', type: 'textarea' },
    ],
  },

  // === DISCOVERY ===
  'discovery/interviews': {
    moduleSlug: 'interviews', category: 'discovery',
    sections: [
      { key: 'participant', label: 'Participant Info', placeholder: 'Name, role, company, segment. How were they recruited?', type: 'textarea', required: true },
      { key: 'context', label: 'Interview Context', placeholder: 'Date, duration, interviewer. What was the goal of this interview?', type: 'textarea' },
      { key: 'keyInsights', label: 'Key Insights', placeholder: 'Top 3-5 insights from this interview.', type: 'textarea', required: true },
      { key: 'quotes', label: 'Notable Quotes', placeholder: 'Direct quotes that capture important sentiments.', type: 'textarea' },
      { key: 'painPoints', label: 'Pain Points', placeholder: 'What frustrations or problems did they describe?', type: 'textarea' },
      { key: 'needs', label: 'Unmet Needs', placeholder: 'What needs are not being met by current solutions?', type: 'textarea' },
      { key: 'opportunities', label: 'Opportunities', placeholder: 'What product opportunities emerged?', type: 'textarea' },
      { key: 'followUp', label: 'Follow-up Actions', placeholder: 'What should we do next based on this interview?', type: 'textarea' },
    ],
  },
  'discovery/synthesis': {
    moduleSlug: 'synthesis', category: 'discovery',
    sections: [
      { key: 'researchGoal', label: 'Research Goal', placeholder: 'What question were we trying to answer?', type: 'textarea', required: true },
      { key: 'methodology', label: 'Methodology', placeholder: 'How was the research conducted? Sample size, methods.', type: 'textarea' },
      { key: 'keyFindings', label: 'Key Findings', placeholder: 'Top findings organized by theme.', type: 'textarea', required: true },
      { key: 'patterns', label: 'Patterns & Themes', placeholder: 'What patterns emerged across participants?', type: 'textarea' },
      { key: 'recommendations', label: 'Recommendations', placeholder: 'What should we do based on these findings?', type: 'textarea', required: true },
      { key: 'limitations', label: 'Limitations', placeholder: 'What are the limitations of this research?', type: 'textarea' },
    ],
  },
  'discovery/personas': {
    moduleSlug: 'personas', category: 'discovery',
    sections: [
      { key: 'name', label: 'Persona Name & Role', placeholder: 'Give this persona a name and title (e.g., "Sarah, Engineering Manager")', type: 'text', required: true },
      { key: 'demographics', label: 'Demographics', placeholder: 'Age, location, experience level, company size.', type: 'textarea' },
      { key: 'goals', label: 'Goals', placeholder: 'What is this persona trying to accomplish?', type: 'textarea', required: true },
      { key: 'painPoints', label: 'Pain Points', placeholder: 'What frustrates them? What obstacles do they face?', type: 'textarea', required: true },
      { key: 'behaviors', label: 'Behaviors', placeholder: 'How do they currently solve this problem? Tools they use?', type: 'textarea' },
      { key: 'jtbd', label: 'Jobs to be Done', placeholder: 'When [situation], I want to [motivation], so I can [outcome].', type: 'textarea' },
      { key: 'quote', label: 'Representative Quote', placeholder: 'A quote that captures this persona\'s mindset.', type: 'textarea' },
    ],
  },
  'discovery/jtbd': {
    moduleSlug: 'jtbd', category: 'discovery',
    sections: [
      { key: 'context', label: 'Research Context', placeholder: 'What research inputs are you using to extract JTBD?', type: 'textarea', required: true },
      { key: 'mainJob', label: 'Main Job', placeholder: 'When [situation], I want to [motivation], so I can [expected outcome].', type: 'textarea', required: true },
      { key: 'relatedJobs', label: 'Related Jobs', placeholder: 'What other jobs are related to or triggered by the main job?', type: 'textarea' },
      { key: 'emotionalJobs', label: 'Emotional Jobs', placeholder: 'How does the user want to feel? What emotions drive the job?', type: 'textarea' },
      { key: 'socialJobs', label: 'Social Jobs', placeholder: 'How does the user want to be perceived by others?', type: 'textarea' },
      { key: 'hiringCriteria', label: 'Hiring Criteria', placeholder: 'What criteria does the user use to "hire" a solution?', type: 'textarea' },
    ],
  },
  'discovery/feedback': {
    moduleSlug: 'feedback', category: 'discovery',
    sections: [
      { key: 'source', label: 'Feedback Source', placeholder: 'Where did this feedback come from? (Intercom, surveys, calls, etc.)', type: 'textarea', required: true },
      { key: 'rawFeedback', label: 'Raw Feedback', placeholder: 'Paste the raw feedback data here.', type: 'textarea', required: true },
      { key: 'themes', label: 'Themes', placeholder: 'What themes emerged? Group feedback by category.', type: 'textarea' },
      { key: 'priorities', label: 'Priority Items', placeholder: 'Which feedback items are highest priority and why?', type: 'textarea' },
      { key: 'actionItems', label: 'Action Items', placeholder: 'What should we do about this feedback?', type: 'textarea' },
    ],
  },
  'discovery/surveys': {
    moduleSlug: 'surveys', category: 'discovery',
    sections: [
      { key: 'objective', label: 'Survey Objective', placeholder: 'What do you want to learn from this survey?', type: 'textarea', required: true },
      { key: 'audience', label: 'Target Audience', placeholder: 'Who should take this survey? Sample size target?', type: 'textarea' },
      { key: 'questions', label: 'Questions', placeholder: 'List your survey questions with type (multiple choice, scale, open-ended).', type: 'textarea', required: true },
      { key: 'analysis', label: 'Analysis Plan', placeholder: 'How will you analyze the results?', type: 'textarea' },
    ],
  },
  'discovery/app-reviews': {
    moduleSlug: 'app-reviews', category: 'discovery',
    sections: [
      { key: 'app', label: 'App / Product', placeholder: 'Which app or product are you analyzing reviews for?', type: 'text', required: true },
      { key: 'reviews', label: 'Reviews Data', placeholder: 'Paste or summarize the reviews you want to analyze.', type: 'textarea', required: true },
      { key: 'sentimentBreakdown', label: 'Sentiment Breakdown', placeholder: 'Positive / Neutral / Negative distribution and key themes per sentiment.', type: 'textarea' },
      { key: 'topIssues', label: 'Top Issues', placeholder: 'Most frequently mentioned issues or complaints.', type: 'textarea' },
      { key: 'opportunities', label: 'Opportunities', placeholder: 'What improvements would most impact ratings?', type: 'textarea' },
    ],
  },
  'discovery/feature-requests': {
    moduleSlug: 'feature-requests', category: 'discovery',
    sections: [
      { key: 'requests', label: 'Feature Requests', placeholder: 'List the feature requests you\'ve collected.', type: 'textarea', required: true },
      { key: 'frequency', label: 'Frequency Analysis', placeholder: 'How often is each request mentioned? By which segments?', type: 'textarea' },
      { key: 'themes', label: 'Themes', placeholder: 'Group requests into themes or categories.', type: 'textarea' },
      { key: 'recommendations', label: 'Recommendations', placeholder: 'Which requests should be prioritized and why?', type: 'textarea' },
    ],
  },
  'discovery/customer-voice': {
    moduleSlug: 'customer-voice', category: 'discovery',
    sections: [
      { key: 'sources', label: 'Data Sources', placeholder: 'What sources are you aggregating? (Support tickets, NPS, interviews, social media)', type: 'textarea', required: true },
      { key: 'topThemes', label: 'Top Themes', placeholder: 'Most common themes across all sources.', type: 'textarea', required: true },
      { key: 'sentiments', label: 'Sentiment Analysis', placeholder: 'Overall sentiment trends. What\'s improving? What\'s declining?', type: 'textarea' },
      { key: 'quotes', label: 'Key Quotes', placeholder: 'Most impactful customer quotes.', type: 'textarea' },
      { key: 'actions', label: 'Recommended Actions', placeholder: 'What should the product team act on?', type: 'textarea' },
    ],
  },

  // === STRATEGY ===
  'strategy/positioning': {
    moduleSlug: 'positioning', category: 'strategy',
    sections: [
      { key: 'competitiveAlternatives', label: 'Competitive Alternatives', placeholder: 'What would customers use if your product didn\'t exist?', type: 'textarea', required: true },
      { key: 'uniqueAttributes', label: 'Unique Attributes', placeholder: 'What features/capabilities do you have that alternatives don\'t?', type: 'textarea', required: true },
      { key: 'value', label: 'Value', placeholder: 'What value do these attributes enable for customers?', type: 'textarea', required: true },
      { key: 'targetCustomers', label: 'Target Customers', placeholder: 'Who cares most about that value? Best-fit customer characteristics.', type: 'textarea', required: true },
      { key: 'marketCategory', label: 'Market Category', placeholder: 'What market category makes your value obvious?', type: 'textarea', required: true },
      { key: 'positioningStatement', label: 'Positioning Statement', placeholder: 'For [target customers] who [need], [product] is a [category] that [key benefit] unlike [alternatives] because [differentiator].', type: 'textarea' },
    ],
  },
  'strategy/gtm': {
    moduleSlug: 'gtm', category: 'strategy',
    sections: [
      { key: 'market', label: 'Market Opportunity', placeholder: 'Market size, growth, and dynamics.', type: 'textarea', required: true },
      { key: 'positioning', label: 'Positioning & Messaging', placeholder: 'Key positioning and core messaging.', type: 'textarea', required: true },
      { key: 'channels', label: 'Distribution Channels', placeholder: 'How will you reach customers? Channel strategy.', type: 'textarea', required: true },
      { key: 'pricing', label: 'Pricing & Packaging', placeholder: 'Pricing model and packaging tiers.', type: 'textarea' },
      { key: 'salesStrategy', label: 'Sales Strategy', placeholder: 'Sales motion: self-serve, sales-led, PLG?', type: 'textarea' },
      { key: 'launchPlan', label: 'Launch Plan', placeholder: 'Key launch activities, timeline, and owners.', type: 'textarea' },
      { key: 'metrics', label: 'Success Metrics', placeholder: 'How will you measure GTM success?', type: 'textarea' },
    ],
  },
  'strategy/okrs': {
    moduleSlug: 'okrs', category: 'strategy',
    sections: [
      { key: 'objective', label: 'Objective', placeholder: 'What do you want to achieve? Make it qualitative and inspiring.', type: 'textarea', required: true },
      { key: 'keyResults', label: 'Key Results', placeholder: 'List 3-5 measurable key results. Each should be specific, time-bound, and have a clear metric.', type: 'textarea', required: true },
      { key: 'initiatives', label: 'Key Initiatives', placeholder: 'What projects/features will drive these key results?', type: 'textarea' },
      { key: 'alignment', label: 'Alignment', placeholder: 'How does this OKR align with company/team objectives?', type: 'textarea' },
      { key: 'risks', label: 'Risks & Dependencies', placeholder: 'What could prevent us from hitting these key results?', type: 'textarea' },
    ],
  },
  'strategy/swot': {
    moduleSlug: 'swot', category: 'strategy',
    sections: [
      { key: 'strengths', label: 'Strengths', placeholder: 'Internal advantages. What do you do well? Unique resources?', type: 'textarea', required: true },
      { key: 'weaknesses', label: 'Weaknesses', placeholder: 'Internal disadvantages. Where can you improve? Resource gaps?', type: 'textarea', required: true },
      { key: 'opportunities', label: 'Opportunities', placeholder: 'External possibilities. Market trends? Competitor weaknesses?', type: 'textarea', required: true },
      { key: 'threats', label: 'Threats', placeholder: 'External risks. Competitive threats? Market shifts? Regulation?', type: 'textarea', required: true },
      { key: 'actions', label: 'Strategic Actions', placeholder: 'What actions does this SWOT suggest?', type: 'textarea' },
    ],
  },
  'strategy/north-star': {
    moduleSlug: 'north-star', category: 'strategy',
    sections: [
      { key: 'metric', label: 'North Star Metric', placeholder: 'What single metric best captures the value you deliver to customers?', type: 'textarea', required: true },
      { key: 'why', label: 'Why This Metric', placeholder: 'Why is this the best proxy for customer value and business success?', type: 'textarea', required: true },
      { key: 'inputMetrics', label: 'Input Metrics', placeholder: 'What 3-5 input metrics drive the north star?', type: 'textarea' },
      { key: 'currentState', label: 'Current State', placeholder: 'What is the current value? Historical trend?', type: 'textarea' },
      { key: 'target', label: 'Target', placeholder: 'What is the target value and by when?', type: 'textarea' },
    ],
  },
  'strategy/vpc': {
    moduleSlug: 'vpc', category: 'strategy',
    sections: [
      { key: 'customerJobs', label: 'Customer Jobs', placeholder: 'What functional, social, and emotional jobs is the customer trying to get done?', type: 'textarea', required: true },
      { key: 'pains', label: 'Customer Pains', placeholder: 'What annoys customers? What risks do they face? What barriers exist?', type: 'textarea', required: true },
      { key: 'gains', label: 'Customer Gains', placeholder: 'What outcomes and benefits do customers expect? What would delight them?', type: 'textarea', required: true },
      { key: 'products', label: 'Products & Services', placeholder: 'What products and services do you offer?', type: 'textarea', required: true },
      { key: 'painRelievers', label: 'Pain Relievers', placeholder: 'How do your products reduce or eliminate customer pains?', type: 'textarea' },
      { key: 'gainCreators', label: 'Gain Creators', placeholder: 'How do your products create customer gains?', type: 'textarea' },
    ],
  },
  'strategy/build-vs-buy': {
    moduleSlug: 'build-vs-buy', category: 'strategy',
    sections: [
      { key: 'need', label: 'The Need', placeholder: 'What capability do you need? Why now?', type: 'textarea', required: true },
      { key: 'buildOption', label: 'Build Option', placeholder: 'Scope, timeline, cost, team needed. What would it take to build?', type: 'textarea', required: true },
      { key: 'buyOption', label: 'Buy Option', placeholder: 'Vendor options, pricing, integration effort. What would it take to buy?', type: 'textarea', required: true },
      { key: 'criteria', label: 'Decision Criteria', placeholder: 'Cost, time, control, expertise, strategic importance, scalability.', type: 'textarea' },
      { key: 'recommendation', label: 'Recommendation', placeholder: 'Build, buy, or hybrid? Why?', type: 'textarea' },
    ],
  },
  'strategy/ai-strategy': {
    moduleSlug: 'ai-strategy', category: 'strategy',
    sections: [
      { key: 'opportunities', label: 'AI Opportunities', placeholder: 'Where can AI add value to your product? Which user problems can AI solve?', type: 'textarea', required: true },
      { key: 'useCases', label: 'Use Cases', placeholder: 'Specific AI/ML use cases ranked by impact and feasibility.', type: 'textarea', required: true },
      { key: 'dataStrategy', label: 'Data Strategy', placeholder: 'What data do you have? What data do you need? How will you collect it?', type: 'textarea' },
      { key: 'buildBuy', label: 'Build vs Buy vs Partner', placeholder: 'For each use case, should you build, buy, or partner?', type: 'textarea' },
      { key: 'risks', label: 'Risks & Ethics', placeholder: 'Bias, privacy, hallucination, reliability, cost considerations.', type: 'textarea' },
      { key: 'roadmap', label: 'AI Roadmap', placeholder: 'Phased plan for AI implementation.', type: 'textarea' },
    ],
  },
  'strategy/pricing': {
    moduleSlug: 'pricing', category: 'strategy',
    sections: [
      { key: 'model', label: 'Pricing Model', placeholder: 'Freemium, subscription, usage-based, per-seat, tiered? Why?', type: 'textarea', required: true },
      { key: 'tiers', label: 'Pricing Tiers', placeholder: 'Define each tier: name, price, included features, target segment.', type: 'textarea', required: true },
      { key: 'competitive', label: 'Competitive Pricing', placeholder: 'How do competitors price? Where do you position?', type: 'textarea' },
      { key: 'valueMetric', label: 'Value Metric', placeholder: 'What is the unit of value customers pay for?', type: 'textarea' },
      { key: 'economics', label: 'Unit Economics', placeholder: 'CAC, LTV, margins, payback period.', type: 'textarea' },
    ],
  },
  'strategy/roadmap-review': {
    moduleSlug: 'roadmap-review', category: 'strategy',
    sections: [
      { key: 'roadmap', label: 'Current Roadmap', placeholder: 'Paste or describe the current roadmap.', type: 'textarea', required: true },
      { key: 'alignment', label: 'Strategic Alignment', placeholder: 'How well does each item align with company strategy?', type: 'textarea' },
      { key: 'gaps', label: 'Gaps', placeholder: 'What\'s missing from the roadmap?', type: 'textarea' },
      { key: 'overcommitments', label: 'Overcommitments', placeholder: 'Are we trying to do too much? What should be cut?', type: 'textarea' },
      { key: 'recommendations', label: 'Recommendations', placeholder: 'Suggested changes to the roadmap and reasoning.', type: 'textarea' },
    ],
  },
  'strategy/devils-advocate': {
    moduleSlug: 'devils-advocate', category: 'strategy',
    sections: [
      { key: 'proposal', label: 'The Proposal', placeholder: 'What strategy or decision are you stress-testing?', type: 'textarea', required: true },
      { key: 'assumptions', label: 'Key Assumptions', placeholder: 'What assumptions does this proposal rely on?', type: 'textarea', required: true },
      { key: 'counterArguments', label: 'Counter-Arguments', placeholder: 'What are the strongest arguments against this proposal?', type: 'textarea' },
      { key: 'worstCase', label: 'Worst Case Scenario', placeholder: 'What happens if this goes completely wrong?', type: 'textarea' },
      { key: 'blindSpots', label: 'Blind Spots', placeholder: 'What are we not seeing? What are we ignoring?', type: 'textarea' },
      { key: 'verdict', label: 'Verdict', placeholder: 'After stress-testing, should we proceed? With what modifications?', type: 'textarea' },
    ],
  },

  // === PLANNING ===
  'planning/roadmap': {
    moduleSlug: 'roadmap', category: 'planning',
    sections: [
      { key: 'vision', label: 'Product Vision', placeholder: 'Where is the product headed in 1-3 years?', type: 'textarea', required: true },
      { key: 'themes', label: 'Strategic Themes', placeholder: 'Key themes that guide the roadmap.', type: 'textarea', required: true },
      { key: 'now', label: 'Now (This Quarter)', placeholder: 'What are we building now and why?', type: 'textarea', required: true },
      { key: 'next', label: 'Next (Next Quarter)', placeholder: 'What\'s coming next?', type: 'textarea' },
      { key: 'later', label: 'Later (Future)', placeholder: 'What\'s on the horizon?', type: 'textarea' },
      { key: 'notDoing', label: 'Not Doing', placeholder: 'What have we explicitly decided NOT to build and why?', type: 'textarea' },
    ],
  },
  'planning/quarterly': {
    moduleSlug: 'quarterly', category: 'planning',
    sections: [
      { key: 'objective', label: 'Quarterly Objective', placeholder: 'What is the single most important thing to achieve this quarter?', type: 'textarea', required: true },
      { key: 'keyResults', label: 'Key Results', placeholder: 'List 3-5 measurable outcomes for this quarter.', type: 'textarea', required: true },
      { key: 'initiatives', label: 'Key Initiatives', placeholder: 'Major projects and their owners.', type: 'textarea', required: true },
      { key: 'capacity', label: 'Capacity Plan', placeholder: 'Team capacity, allocation, and any hiring needs.', type: 'textarea' },
      { key: 'risks', label: 'Risks & Dependencies', placeholder: 'Cross-team dependencies and potential blockers.', type: 'textarea' },
    ],
  },
  'planning/sprints': {
    moduleSlug: 'sprints', category: 'planning',
    sections: [
      { key: 'goal', label: 'Sprint Goal', placeholder: 'What is the single goal for this sprint?', type: 'textarea', required: true },
      { key: 'stories', label: 'Sprint Backlog', placeholder: 'Stories committed to this sprint with point estimates.', type: 'textarea', required: true },
      { key: 'capacity', label: 'Team Capacity', placeholder: 'Available capacity, PTO, other commitments.', type: 'textarea' },
      { key: 'risks', label: 'Sprint Risks', placeholder: 'What could derail this sprint?', type: 'textarea' },
      { key: 'definition', label: 'Definition of Done', placeholder: 'What does "done" mean for this sprint?', type: 'textarea' },
    ],
  },
  'planning/decomposition': {
    moduleSlug: 'decomposition', category: 'planning',
    sections: [
      { key: 'feature', label: 'Feature', placeholder: 'What feature are you decomposing?', type: 'textarea', required: true },
      { key: 'mvp', label: 'MVP Slice', placeholder: 'What is the smallest shippable version?', type: 'textarea', required: true },
      { key: 'increments', label: 'Increments', placeholder: 'List incremental slices after MVP, each delivering additional value.', type: 'textarea', required: true },
      { key: 'dependencies', label: 'Dependencies', placeholder: 'Technical and cross-team dependencies for each increment.', type: 'textarea' },
    ],
  },
  'planning/daily': {
    moduleSlug: 'daily', category: 'planning',
    sections: [
      { key: 'priorities', label: 'Top 3 Priorities', placeholder: 'What are the 3 most important things to accomplish today?', type: 'textarea', required: true },
      { key: 'meetings', label: 'Meetings & Calls', placeholder: 'What meetings do you have? What\'s the goal of each?', type: 'textarea' },
      { key: 'blockers', label: 'Blockers', placeholder: 'What\'s blocking you? Who can help?', type: 'textarea' },
      { key: 'reflection', label: 'End-of-Day Reflection', placeholder: 'What did you accomplish? What rolls over to tomorrow?', type: 'textarea' },
    ],
  },
  'planning/weekly': {
    moduleSlug: 'weekly', category: 'planning',
    sections: [
      { key: 'goals', label: 'Weekly Goals', placeholder: 'What are the 3-5 goals for this week?', type: 'textarea', required: true },
      { key: 'keyActivities', label: 'Key Activities', placeholder: 'Major activities planned for each day.', type: 'textarea' },
      { key: 'stakeholder', label: 'Stakeholder Touchpoints', placeholder: 'Who do you need to align with this week?', type: 'textarea' },
      { key: 'review', label: 'Week in Review', placeholder: 'Accomplishments, learnings, and what to carry forward.', type: 'textarea' },
    ],
  },

  // === ANALYTICS ===
  'analytics/metrics': {
    moduleSlug: 'metrics', category: 'analytics',
    sections: [
      { key: 'acquisition', label: 'Acquisition', placeholder: 'How do users find you? Key metrics: signups, traffic sources, CAC.', type: 'textarea', required: true },
      { key: 'activation', label: 'Activation', placeholder: 'What is the "aha moment"? Key metric and current performance.', type: 'textarea', required: true },
      { key: 'retention', label: 'Retention', placeholder: 'How well do you retain users? Cohort analysis, churn rate.', type: 'textarea', required: true },
      { key: 'revenue', label: 'Revenue', placeholder: 'How do you make money? ARPU, LTV, expansion revenue.', type: 'textarea' },
      { key: 'referral', label: 'Referral', placeholder: 'Do users refer others? NPS, viral coefficient.', type: 'textarea' },
    ],
  },
  'analytics/ab-design': {
    moduleSlug: 'ab-design', category: 'analytics',
    sections: [
      { key: 'hypothesis', label: 'Hypothesis', placeholder: 'If we [change], then [metric] will [improve/decrease] because [reason].', type: 'textarea', required: true },
      { key: 'variants', label: 'Variants', placeholder: 'Describe control and treatment variants.', type: 'textarea', required: true },
      { key: 'metric', label: 'Primary Metric', placeholder: 'What is the primary metric? What is the minimum detectable effect?', type: 'textarea', required: true },
      { key: 'sampleSize', label: 'Sample Size', placeholder: 'Required sample size and estimated duration.', type: 'textarea' },
      { key: 'guardrails', label: 'Guardrail Metrics', placeholder: 'Metrics that must not degrade.', type: 'textarea' },
    ],
  },
  'analytics/ab-analysis': {
    moduleSlug: 'ab-analysis', category: 'analytics',
    sections: [
      { key: 'summary', label: 'Test Summary', placeholder: 'Test name, duration, sample size, variants.', type: 'textarea', required: true },
      { key: 'results', label: 'Results', placeholder: 'Control vs treatment performance. Statistical significance?', type: 'textarea', required: true },
      { key: 'guardrails', label: 'Guardrail Results', placeholder: 'Did any guardrail metrics degrade?', type: 'textarea' },
      { key: 'interpretation', label: 'Interpretation', placeholder: 'What do these results mean? Any surprising findings?', type: 'textarea' },
      { key: 'decision', label: 'Decision', placeholder: 'Ship, iterate, or kill? What\'s next?', type: 'textarea', required: true },
    ],
  },
  'analytics/funnels': {
    moduleSlug: 'funnels', category: 'analytics',
    sections: [
      { key: 'funnel', label: 'Funnel Definition', placeholder: 'Define each step of the funnel and what qualifies as conversion.', type: 'textarea', required: true },
      { key: 'data', label: 'Funnel Data', placeholder: 'Volume and conversion rate at each step.', type: 'textarea', required: true },
      { key: 'dropoffs', label: 'Drop-off Analysis', placeholder: 'Where are the biggest drop-offs? Why?', type: 'textarea' },
      { key: 'recommendations', label: 'Optimization Recommendations', placeholder: 'What changes would improve conversion?', type: 'textarea' },
    ],
  },
  'analytics/experiments': {
    moduleSlug: 'experiments', category: 'analytics',
    sections: [
      { key: 'hypothesis', label: 'Hypothesis', placeholder: 'What do you believe to be true? Why?', type: 'textarea', required: true },
      { key: 'experiment', label: 'Experiment Design', placeholder: 'How will you test this hypothesis?', type: 'textarea', required: true },
      { key: 'successCriteria', label: 'Success Criteria', placeholder: 'What results would validate/invalidate the hypothesis?', type: 'textarea', required: true },
      { key: 'timeline', label: 'Timeline & Resources', placeholder: 'How long? What resources are needed?', type: 'textarea' },
      { key: 'results', label: 'Results & Learnings', placeholder: 'What happened? What did you learn?', type: 'textarea' },
    ],
  },
  'analytics/dashboards': {
    moduleSlug: 'dashboards', category: 'analytics',
    sections: [
      { key: 'audience', label: 'Dashboard Audience', placeholder: 'Who will use this dashboard? What decisions will it inform?', type: 'textarea', required: true },
      { key: 'metrics', label: 'Key Metrics', placeholder: 'List all metrics to include with definitions and data sources.', type: 'textarea', required: true },
      { key: 'layout', label: 'Layout & Visualization', placeholder: 'How should metrics be organized? Chart types for each?', type: 'textarea' },
      { key: 'filters', label: 'Filters & Segments', placeholder: 'What dimensions should users filter/segment by?', type: 'textarea' },
      { key: 'alerts', label: 'Alerts', placeholder: 'What thresholds should trigger alerts?', type: 'textarea' },
    ],
  },

  // === COMPETITIVE ===
  'competitive/profiles': {
    moduleSlug: 'profiles', category: 'competitive',
    sections: [
      { key: 'overview', label: 'Competitor Overview', placeholder: 'Name, founded, funding, team size, revenue estimate.', type: 'textarea', required: true },
      { key: 'product', label: 'Product Analysis', placeholder: 'Key features, UX, technology, integrations.', type: 'textarea', required: true },
      { key: 'strengths', label: 'Strengths', placeholder: 'What do they do well?', type: 'textarea' },
      { key: 'weaknesses', label: 'Weaknesses', placeholder: 'Where do they fall short?', type: 'textarea' },
      { key: 'strategy', label: 'Their Strategy', placeholder: 'What is their positioning? Target market? Go-to-market?', type: 'textarea' },
      { key: 'ourAdvantage', label: 'Our Advantage', placeholder: 'How do we differentiate against them?', type: 'textarea' },
    ],
  },
  'competitive/market-sizing': {
    moduleSlug: 'market-sizing', category: 'competitive',
    sections: [
      { key: 'tam', label: 'TAM (Total Addressable Market)', placeholder: 'Total revenue opportunity if 100% market share. How did you calculate?', type: 'textarea', required: true },
      { key: 'sam', label: 'SAM (Serviceable Addressable Market)', placeholder: 'Segment of TAM targeted by your product. Geographic, segment, use-case constraints.', type: 'textarea', required: true },
      { key: 'som', label: 'SOM (Serviceable Obtainable Market)', placeholder: 'Realistic market capture in 3-5 years. Based on what assumptions?', type: 'textarea', required: true },
      { key: 'methodology', label: 'Methodology', placeholder: 'Top-down or bottom-up? Data sources?', type: 'textarea' },
      { key: 'growthDrivers', label: 'Growth Drivers', placeholder: 'What will drive market growth?', type: 'textarea' },
    ],
  },
  'competitive/win-loss': {
    moduleSlug: 'win-loss', category: 'competitive',
    sections: [
      { key: 'deal', label: 'Deal Summary', placeholder: 'Customer name, deal size, competitors involved, outcome (win/loss).', type: 'textarea', required: true },
      { key: 'reasons', label: 'Key Reasons', placeholder: 'Why did we win or lose? Top 3 factors.', type: 'textarea', required: true },
      { key: 'competitorStrengths', label: 'Competitor Strengths', placeholder: 'What did the competitor do well?', type: 'textarea' },
      { key: 'ourStrengths', label: 'Our Strengths', placeholder: 'What did we do well?', type: 'textarea' },
      { key: 'learnings', label: 'Learnings & Actions', placeholder: 'What should we change based on this?', type: 'textarea' },
    ],
  },

  // === COMMUNICATION ===
  'communication/release-notes': {
    moduleSlug: 'release-notes', category: 'communication',
    sections: [
      { key: 'version', label: 'Version / Release', placeholder: 'v2.1.0 — March 2026', type: 'text', required: true },
      { key: 'highlights', label: 'Highlights', placeholder: 'Top 3 highlights of this release.', type: 'textarea', required: true },
      { key: 'newFeatures', label: 'New Features', placeholder: 'List all new features with descriptions.', type: 'textarea', required: true },
      { key: 'improvements', label: 'Improvements', placeholder: 'List improvements and enhancements.', type: 'textarea' },
      { key: 'bugFixes', label: 'Bug Fixes', placeholder: 'List notable bug fixes.', type: 'textarea' },
      { key: 'breakingChanges', label: 'Breaking Changes', placeholder: 'Any breaking changes and migration steps.', type: 'textarea' },
    ],
  },
  'communication/exec-update': {
    moduleSlug: 'exec-update', category: 'communication',
    sections: [
      { key: 'situation', label: 'Situation', placeholder: 'What is the current state? Context the reader needs.', type: 'textarea', required: true },
      { key: 'complication', label: 'Complication', placeholder: 'What has changed? What is the challenge or opportunity?', type: 'textarea', required: true },
      { key: 'question', label: 'Question', placeholder: 'What question does this raise?', type: 'textarea', required: true },
      { key: 'answer', label: 'Answer', placeholder: 'What is your recommendation?', type: 'textarea', required: true },
      { key: 'metrics', label: 'Key Metrics', placeholder: 'Supporting metrics and data.', type: 'textarea' },
      { key: 'nextSteps', label: 'Next Steps', placeholder: 'What are the next steps and who owns them?', type: 'textarea' },
    ],
  },
  'communication/stakeholder-sim': {
    moduleSlug: 'stakeholder-sim', category: 'communication',
    sections: [
      { key: 'proposal', label: 'The Proposal', placeholder: 'What are you proposing to stakeholders?', type: 'textarea', required: true },
      { key: 'stakeholders', label: 'Key Stakeholders', placeholder: 'List each stakeholder, their role, and their likely concerns.', type: 'textarea', required: true },
      { key: 'reactions', label: 'Predicted Reactions', placeholder: 'How will each stakeholder likely react? Supportive, neutral, opposed?', type: 'textarea' },
      { key: 'objections', label: 'Key Objections', placeholder: 'What objections are most likely? How will you address each?', type: 'textarea' },
      { key: 'strategy', label: 'Communication Strategy', placeholder: 'How will you present this? What order? 1:1 or group?', type: 'textarea' },
    ],
  },
  'communication/meeting-notes': {
    moduleSlug: 'meeting-notes', category: 'communication',
    sections: [
      { key: 'attendees', label: 'Attendees', placeholder: 'Who was in the meeting?', type: 'textarea', required: true },
      { key: 'agenda', label: 'Agenda', placeholder: 'What was discussed?', type: 'textarea' },
      { key: 'notes', label: 'Discussion Notes', placeholder: 'Key points from the discussion.', type: 'textarea', required: true },
      { key: 'decisions', label: 'Decisions Made', placeholder: 'What was decided?', type: 'textarea' },
      { key: 'actionItems', label: 'Action Items', placeholder: 'Who is doing what by when?', type: 'textarea', required: true },
    ],
  },
  'communication/decision-doc': {
    moduleSlug: 'decision-doc', category: 'communication',
    sections: [
      { key: 'decision', label: 'Decision', placeholder: 'What is the decision being made?', type: 'textarea', required: true },
      { key: 'context', label: 'Context', placeholder: 'Background and why this decision is needed now.', type: 'textarea', required: true },
      { key: 'options', label: 'Options Considered', placeholder: 'List all options with pros and cons.', type: 'textarea', required: true },
      { key: 'recommendation', label: 'Recommendation', placeholder: 'Which option do you recommend and why?', type: 'textarea', required: true },
      { key: 'impact', label: 'Impact', placeholder: 'What is the impact of this decision? Who is affected?', type: 'textarea' },
      { key: 'reversibility', label: 'Reversibility', placeholder: 'Is this a one-way or two-way door? Can we change course?', type: 'textarea' },
    ],
  },
  'communication/board-deck': {
    moduleSlug: 'board-deck', category: 'communication',
    sections: [
      { key: 'executiveSummary', label: 'Executive Summary', placeholder: 'High-level summary for the board.', type: 'textarea', required: true },
      { key: 'metrics', label: 'Key Metrics', placeholder: 'Business and product metrics with trends.', type: 'textarea', required: true },
      { key: 'highlights', label: 'Highlights', placeholder: 'Top achievements this period.', type: 'textarea' },
      { key: 'challenges', label: 'Challenges', placeholder: 'Current challenges and mitigation plans.', type: 'textarea' },
      { key: 'roadmap', label: 'Product Roadmap', placeholder: 'Key initiatives for next quarter/half.', type: 'textarea' },
      { key: 'asks', label: 'Board Asks', placeholder: 'What guidance, decisions, or resources are you requesting?', type: 'textarea' },
    ],
  },
  'communication/agenda': {
    moduleSlug: 'agenda', category: 'communication',
    sections: [
      { key: 'objective', label: 'Meeting Objective', placeholder: 'What is the purpose of this meeting?', type: 'textarea', required: true },
      { key: 'attendees', label: 'Attendees', placeholder: 'Who should attend? Who is optional?', type: 'textarea' },
      { key: 'items', label: 'Agenda Items', placeholder: 'List each item with time allocation and owner.', type: 'textarea', required: true },
      { key: 'prework', label: 'Pre-work', placeholder: 'What should attendees prepare before the meeting?', type: 'textarea' },
      { key: 'outcomes', label: 'Expected Outcomes', placeholder: 'What decisions or outcomes are expected?', type: 'textarea' },
    ],
  },

  // === LAUNCH ===
  'launch/announcement': {
    moduleSlug: 'announcement', category: 'launch',
    sections: [
      { key: 'headline', label: 'Headline', placeholder: 'Attention-grabbing headline for the announcement.', type: 'text', required: true },
      { key: 'summary', label: 'Summary', placeholder: 'One paragraph summary of what\'s new and why it matters.', type: 'textarea', required: true },
      { key: 'details', label: 'Feature Details', placeholder: 'Detailed description of new features and capabilities.', type: 'textarea', required: true },
      { key: 'benefits', label: 'Customer Benefits', placeholder: 'How does this help customers? Include specific use cases.', type: 'textarea' },
      { key: 'cta', label: 'Call to Action', placeholder: 'What should users do next?', type: 'textarea' },
    ],
  },
  'launch/checklist': {
    moduleSlug: 'checklist', category: 'launch',
    sections: [
      { key: 'product', label: 'Product Readiness', placeholder: 'Feature complete, QA passed, performance tested, monitoring set up.', type: 'textarea', required: true },
      { key: 'marketing', label: 'Marketing', placeholder: 'Blog post, social media, email, landing page, press.', type: 'textarea' },
      { key: 'sales', label: 'Sales Enablement', placeholder: 'Sales deck, demo script, FAQs, competitive objection handling.', type: 'textarea' },
      { key: 'support', label: 'Customer Support', placeholder: 'Help docs, support team briefed, known issues documented.', type: 'textarea' },
      { key: 'rollback', label: 'Rollback Plan', placeholder: 'How to roll back if something goes wrong.', type: 'textarea' },
    ],
  },
  'launch/sales-enablement': {
    moduleSlug: 'sales-enablement', category: 'launch',
    sections: [
      { key: 'overview', label: 'Product Overview', placeholder: 'What are we launching? Key value propositions.', type: 'textarea', required: true },
      { key: 'targetBuyer', label: 'Target Buyer', placeholder: 'Who is the ideal buyer? Their title, pain points, buying criteria.', type: 'textarea', required: true },
      { key: 'talkingPoints', label: 'Talking Points', placeholder: 'Key messages and value statements for sales conversations.', type: 'textarea', required: true },
      { key: 'objections', label: 'Objection Handling', placeholder: 'Common objections and how to address them.', type: 'textarea' },
      { key: 'competitivePos', label: 'Competitive Positioning', placeholder: 'How we compare to alternatives. Battlecards.', type: 'textarea' },
      { key: 'demo', label: 'Demo Script', placeholder: 'Key flows to demo and the story to tell.', type: 'textarea' },
    ],
  },
  'launch/readiness': {
    moduleSlug: 'readiness', category: 'launch',
    sections: [
      { key: 'criteria', label: 'Readiness Criteria', placeholder: 'What must be true for us to launch?', type: 'textarea', required: true },
      { key: 'status', label: 'Current Status', placeholder: 'Status of each readiness criteria (Ready / At Risk / Not Ready).', type: 'textarea', required: true },
      { key: 'blockers', label: 'Blockers', placeholder: 'What is blocking launch readiness?', type: 'textarea' },
      { key: 'goNoGo', label: 'Go / No-Go Decision', placeholder: 'Recommendation: launch, delay, or conditional launch?', type: 'textarea' },
    ],
  },

  // === OPERATIONS ===
  'operations/retro': {
    moduleSlug: 'retro', category: 'operations',
    sections: [
      { key: 'wentWell', label: 'What Went Well', placeholder: 'What should we keep doing?', type: 'textarea', required: true },
      { key: 'improvements', label: 'What Could Improve', placeholder: 'What should we change?', type: 'textarea', required: true },
      { key: 'actionItems', label: 'Action Items', placeholder: 'Specific actions, owners, and deadlines.', type: 'textarea', required: true },
      { key: 'shoutouts', label: 'Shoutouts', placeholder: 'Who deserves recognition this sprint?', type: 'textarea' },
      { key: 'mood', label: 'Team Mood', placeholder: 'How is the team feeling? Energy level?', type: 'textarea' },
    ],
  },
  'operations/processes': {
    moduleSlug: 'processes', category: 'operations',
    sections: [
      { key: 'processName', label: 'Process Name', placeholder: 'What is this process called?', type: 'text', required: true },
      { key: 'purpose', label: 'Purpose', placeholder: 'Why does this process exist?', type: 'textarea', required: true },
      { key: 'steps', label: 'Steps', placeholder: 'Step-by-step instructions.', type: 'textarea', required: true },
      { key: 'roles', label: 'Roles & Responsibilities', placeholder: 'Who is responsible for what?', type: 'textarea' },
      { key: 'tools', label: 'Tools', placeholder: 'What tools are used in this process?', type: 'textarea' },
      { key: 'frequency', label: 'Frequency', placeholder: 'How often does this process run?', type: 'textarea' },
    ],
  },
  'operations/post-mortem': {
    moduleSlug: 'post-mortem', category: 'operations',
    sections: [
      { key: 'incident', label: 'Incident Summary', placeholder: 'What happened? When? Duration? Impact?', type: 'textarea', required: true },
      { key: 'timeline', label: 'Timeline', placeholder: 'Chronological timeline of events.', type: 'textarea', required: true },
      { key: 'rootCause', label: 'Root Cause', placeholder: 'What was the root cause? Use 5 Whys if helpful.', type: 'textarea', required: true },
      { key: 'impact', label: 'Impact', placeholder: 'Users affected, revenue impact, duration.', type: 'textarea' },
      { key: 'whatWorked', label: 'What Worked', placeholder: 'What went well in the response?', type: 'textarea' },
      { key: 'actionItems', label: 'Action Items', placeholder: 'Preventive measures with owners and deadlines.', type: 'textarea', required: true },
    ],
  },
  'operations/cs-playbook': {
    moduleSlug: 'cs-playbook', category: 'operations',
    sections: [
      { key: 'scenario', label: 'Scenario', placeholder: 'What customer success scenario is this playbook for?', type: 'textarea', required: true },
      { key: 'triggers', label: 'Triggers', placeholder: 'What signals indicate this playbook should be used?', type: 'textarea', required: true },
      { key: 'steps', label: 'Playbook Steps', placeholder: 'Step-by-step actions for the CS team.', type: 'textarea', required: true },
      { key: 'messaging', label: 'Messaging Templates', placeholder: 'Email/chat templates for this scenario.', type: 'textarea' },
      { key: 'escalation', label: 'Escalation Path', placeholder: 'When and how to escalate.', type: 'textarea' },
    ],
  },
  'operations/meeting-templates': {
    moduleSlug: 'meeting-templates', category: 'operations',
    sections: [
      { key: 'templateType', label: 'Meeting Type', placeholder: '1:1, Sprint Review, Sprint Planning, Stakeholder Review, All-Hands, etc.', type: 'text', required: true },
      { key: 'duration', label: 'Duration', placeholder: 'Recommended meeting duration.', type: 'text' },
      { key: 'agenda', label: 'Agenda Template', placeholder: 'Standard agenda items with time allocation.', type: 'textarea', required: true },
      { key: 'prework', label: 'Pre-work', placeholder: 'What should attendees prepare?', type: 'textarea' },
      { key: 'followUp', label: 'Follow-up Template', placeholder: 'Standard follow-up email/message template.', type: 'textarea' },
    ],
  },
};

export function getTemplate(category: string, moduleSlug: string): ModuleTemplate | undefined {
  return templates[`${category}/${moduleSlug}`];
}

export { templates };
