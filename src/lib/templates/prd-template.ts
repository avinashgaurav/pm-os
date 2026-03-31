import type { ModuleTemplate } from '@/types';

export const prdTemplate: ModuleTemplate = {
  moduleSlug: 'prd',
  category: 'specs',
  sections: [
    {
      key: 'problem',
      label: 'Problem Statement',
      placeholder: 'What problem are we solving? Who experiences this problem and how frequently? What is the impact of not solving it?',
      type: 'textarea',
      required: true,
    },
    {
      key: 'targetUsers',
      label: 'Target Users',
      placeholder: 'Who are the primary and secondary users? What are their key characteristics, needs, and pain points?',
      type: 'textarea',
      required: true,
    },
    {
      key: 'goals',
      label: 'Goals & Success Metrics',
      placeholder: 'What are the business goals? What metrics will define success? What is the target for each metric?',
      type: 'textarea',
      required: true,
    },
    {
      key: 'userStories',
      label: 'User Stories & Requirements',
      placeholder: 'As a [user type], I want to [action] so that [benefit].\n\nList functional and non-functional requirements.',
      type: 'textarea',
      required: true,
    },
    {
      key: 'scope',
      label: 'Scope & Constraints',
      placeholder: 'What is in scope? What is explicitly out of scope? What are the technical, timeline, or resource constraints?',
      type: 'textarea',
    },
    {
      key: 'solution',
      label: 'Proposed Solution',
      placeholder: 'Describe the proposed solution at a high level. Include key features, user flows, and how it addresses the problem.',
      type: 'textarea',
    },
    {
      key: 'alternatives',
      label: 'Alternatives Considered',
      placeholder: 'What other approaches were considered? Why were they rejected?',
      type: 'textarea',
    },
    {
      key: 'technicalApproach',
      label: 'Technical Approach',
      placeholder: 'High-level technical architecture, key APIs, data models, dependencies, and integration points.',
      type: 'textarea',
    },
    {
      key: 'timeline',
      label: 'Timeline & Milestones',
      placeholder: 'Key milestones, phases, target dates, and dependencies. Include alpha/beta/GA dates if applicable.',
      type: 'textarea',
    },
    {
      key: 'risks',
      label: 'Risks & Mitigations',
      placeholder: 'What could go wrong? List key risks and their mitigation strategies.',
      type: 'textarea',
    },
    {
      key: 'openQuestions',
      label: 'Open Questions',
      placeholder: 'What decisions still need to be made? Who needs to weigh in?',
      type: 'textarea',
    },
  ],
};
