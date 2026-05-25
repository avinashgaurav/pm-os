'use client';
import { useState } from 'react';
import { AIAnalysisButton } from '@/components/shared/ai-analysis';
import { PageHeader } from '@/components/shared/page-header';
import { Textarea } from '@/components/ui/textarea';
const sections = [
  {
    key: 'vision',
    label: 'Vision',
    placeholder: 'What is the long-term vision?',
    color: '#00C68C',
    span: 'col-span-2',
  },
  {
    key: 'targetGroup',
    label: 'Target Group',
    placeholder: 'Who are the target customers?',
    color: '#13BBCA',
    span: '',
  },
  {
    key: 'needs',
    label: 'Needs',
    placeholder: 'What needs does the product address?',
    color: '#D0F255',
    span: '',
  },
  {
    key: 'product',
    label: 'Product',
    placeholder: 'What is the product? Key features?',
    color: '#a855f7',
    span: '',
  },
  {
    key: 'businessGoals',
    label: 'Business Goals',
    placeholder: 'What are the business goals?',
    color: '#f59e0b',
    span: '',
  },
  {
    key: 'revenue',
    label: 'Revenue Streams',
    placeholder: 'How does it generate revenue?',
    color: '#ef4444',
    span: 'col-span-2',
  },
];
export default function VisionBoardPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  return (
    <div>
      <PageHeader
        title="Vision Board"
        description="Create a structured product vision board"
        actions={
          <AIAnalysisButton
            category="strategy"
            moduleSlug="vision-board"
            buttonLabel="AI: Review Vision"
            getData={() => JSON.stringify(values)}
          />
        }
      />
      <div className="grid grid-cols-2 gap-4">
        {sections.map((s) => (
          <div key={s.key} className={`surface hairline rounded-2xl p-5 ${s.span}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              <h3
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: s.color }}
              >
                {s.label}
              </h3>
            </div>
            <Textarea
              rows={4}
              value={values[s.key] || ''}
              onChange={(e) => setValues((p) => ({ ...p, [s.key]: e.target.value }))}
              placeholder={s.placeholder}
              className="text-sm bg-transparent border-0 focus-visible:ring-0 resize-none p-0 placeholder:text-muted-foreground/40"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
