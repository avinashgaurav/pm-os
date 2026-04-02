'use client';
import { useState } from 'react';
import { Plus, X, Smile, Meh, Frown } from 'lucide-react';
import { nanoid } from 'nanoid';
import { AIAnalysisButton } from '@/components/shared/ai-analysis';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Stage { id: string; name: string; touchpoints: string; emotion: 'happy'|'neutral'|'sad'; painPoints: string; opportunities: string; }
const emotionIcons = { happy: Smile, neutral: Meh, sad: Frown };
const emotionColors = { happy: '#00C68C', neutral: '#f59e0b', sad: '#ef4444' };

export default function JourneyMapPage() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [input, setInput] = useState('');
  const addStage = () => { if (!input.trim()) return; setStages(p => [...p, { id: nanoid(), name: input, touchpoints: '', emotion: 'neutral', painPoints: '', opportunities: '' }]); setInput(''); };
  const updateStage = (id: string, field: keyof Stage, value: string) => setStages(p => p.map(s => s.id === id ? {...s, [field]: value} : s));
  const removeStage = (id: string) => setStages(p => p.filter(s => s.id !== id));

  return (
    <div>
      <PageHeader title="Journey Map" description="Map the end-to-end customer experience across stages" />
      <div className="flex items-center gap-2 mb-6">
        <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addStage()} placeholder="Add stage (e.g. Awareness, Purchase)..." className="max-w-sm" />
        <Button size="sm" onClick={addStage} className="gap-1.5"><Plus className="h-3.5 w-3.5" />Add Stage</Button>
        <AIAnalysisButton category="discovery" moduleSlug="journey-map" buttonLabel="AI: Improve Journey" getData={() => { try { return stages.map(s => s.name+': '+s.touchpoints+' | pains: '+s.painPoints).join('\n'); } catch { return ''; } }} />
      </div>
      {stages.length === 0 ? <div className="glass-card rounded-2xl p-12 text-center text-sm text-muted-foreground">Add stages to map the customer journey</div> : (
        <ScrollArea className="w-full"><div className="flex gap-4 pb-4 min-w-max">
          {stages.map((stage, i) => { const EIcon = emotionIcons[stage.emotion]; return (
            <div key={stage.id} className="glass-card rounded-2xl p-5 w-[280px] shrink-0 space-y-3">
              <div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="text-[10px] font-mono text-muted-foreground/50">{i+1}</span><h3 className="text-sm font-semibold">{stage.name}</h3></div><button onClick={() => removeStage(stage.id)} className="p-1 rounded hover:bg-accent"><X className="h-3 w-3 text-muted-foreground" /></button></div>
              <div><label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Emotion</label><div className="flex gap-2 mt-1">{(['happy','neutral','sad'] as const).map(e => { const Icon = emotionIcons[e]; return <button key={e} onClick={() => updateStage(stage.id, 'emotion', e)} className={'p-1.5 rounded-lg transition-colors '+(stage.emotion===e?'bg-accent':'hover:bg-accent/50')}><Icon className="h-4 w-4" style={{color: emotionColors[e]}} /></button>; })}</div></div>
              <div><label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Touchpoints</label><Textarea rows={2} className="mt-1 text-xs" value={stage.touchpoints} onChange={e => updateStage(stage.id, 'touchpoints', e.target.value)} placeholder="How do they interact?" /></div>
              <div><label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Pain Points</label><Textarea rows={2} className="mt-1 text-xs" value={stage.painPoints} onChange={e => updateStage(stage.id, 'painPoints', e.target.value)} placeholder="What frustrates them?" /></div>
              <div><label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Opportunities</label><Textarea rows={2} className="mt-1 text-xs" value={stage.opportunities} onChange={e => updateStage(stage.id, 'opportunities', e.target.value)} placeholder="How to improve?" /></div>
            </div>); })}
        </div></ScrollArea>
      )}
    </div>
  );
}