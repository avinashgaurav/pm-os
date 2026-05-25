'use client';
import { useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { AIAnalysisButton } from '@/components/shared/ai-analysis';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
const dimensions = [
  { key: 'speed', label: 'Speed', desc: 'Do we ship fast enough?' },
  { key: 'quality', label: 'Quality', desc: 'Are we proud of the work?' },
  { key: 'fun', label: 'Fun', desc: 'Do we enjoy working together?' },
  { key: 'support', label: 'Support', desc: 'Do we get help we need?' },
  { key: 'mission', label: 'Mission', desc: 'Do we know why we build this?' },
  { key: 'learning', label: 'Learning', desc: 'Are we growing skills?' },
  { key: 'autonomy', label: 'Autonomy', desc: 'Do we have decision freedom?' },
  { key: 'value', label: 'Value', desc: 'Are we delivering real value?' },
];
const emoji = (v: number) => (v >= 4 ? '🟢' : v >= 3 ? '🟡' : '🔴');
export default function TeamHealthPage() {
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const d: Record<string, number> = {};
    dimensions.forEach((dim) => {
      d[dim.key] = 3;
    });
    return d;
  });
  const avg = dimensions.length
    ? Math.round((dimensions.reduce((s, d) => s + scores[d.key], 0) / dimensions.length) * 10) / 10
    : 0;
  return (
    <div>
      <PageHeader
        title="Team Health Check"
        description="Assess team health across key dimensions"
        actions={
          <>
            <AIAnalysisButton
              category="operations"
              moduleSlug="team-health"
              buttonLabel="AI: Improve Health"
              getData={() =>
                Object.entries(scores)
                  .map(([k, v]) => `${k}: ${v}/5`)
                  .join('\n')
              }
            />
            <Button
              size="sm"
              onClick={() => toast.success('Health check saved')}
              className="gap-1.5"
            >
              <Save className="h-3.5 w-3.5" />
              Save
            </Button>
          </>
        }
      />
      <div className="flex gap-4 mb-8">
        <div className="surface hairline rounded-2xl p-5 text-center">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Overall</p>
          <p className="text-3xl font-bold font-mono mt-1">
            {emoji(avg)} {avg}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {dimensions.map((dim) => (
          <div key={dim.key} className="surface hairline rounded-2xl p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold">{dim.label}</h3>
              <span className="text-lg">
                {emoji(scores[dim.key])}{' '}
                <span className="text-sm font-mono font-bold">{scores[dim.key]}</span>
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3">{dim.desc}</p>
            <Slider
              min={1}
              max={5}
              step={1}
              value={[scores[dim.key]]}
              onValueChange={(val) => {
                const v = Array.isArray(val) ? val[0] : val;
                setScores((s) => ({ ...s, [dim.key]: v }));
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
