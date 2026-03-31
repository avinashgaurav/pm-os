'use client';
import { useState, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { useLiveQuery } from 'dexie-react-hooks';
import { toast } from 'sonner';
import { Plus, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { competencyDimensions } from '@/lib/templates/competency-data';

export default function CompetencyPage() {
  const scores = useLiveQuery(() => db.competencyScores.orderBy('date').reverse().toArray()) ?? [];
  const [editing, setEditing] = useState(false);
  const [currentScores, setCurrentScores] = useState<Record<string, number>>(() => {
    const defaults: Record<string, number> = {};
    competencyDimensions.forEach(d => { defaults[d.key] = 3; });
    return defaults;
  });

  const latestScores = competencyDimensions.map(d => {
    const latest = scores.find(s => s.dimension === d.key);
    return { dimension: d.label, fullMark: 5, score: latest?.score ?? 0, key: d.key };
  });

  const handleSave = useCallback(async () => {
    const now = new Date().toISOString();
    for (const dim of competencyDimensions) {
      await db.competencyScores.add({ id: nanoid(), dimension: dim.key, score: currentScores[dim.key], notes: '', date: now });
    }
    setEditing(false);
    toast.success('Scores saved');
  }, [currentScores]);

  return (
    <div>
      <PageHeader title="PM Competency Tracker" description="Assess and track your PM skill development across key dimensions" isNew
        actions={!editing ? <Button size="sm" onClick={() => setEditing(true)} className="gap-1.5"><Plus className="h-3.5 w-3.5" />New Assessment</Button> : undefined} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Competency Radar</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={latestScores}>
                <PolarGrid stroke="oklch(0.25 0.015 270)" />
                <PolarAngleAxis dataKey="dimension" tick={{ fill: 'oklch(0.55 0.02 270)', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: 'oklch(0.4 0.01 270)', fontSize: 10 }} />
                <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          {editing ? (
            <div className="space-y-5">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Rate Yourself (1-5)</h3>
              {competencyDimensions.map(d => (
                <div key={d.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-sm font-medium">{d.label}</Label>
                    <span className="text-sm font-mono font-bold text-primary">{currentScores[d.key]}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-2">{d.description}</p>
                  <Slider min={1} max={5} step={1} value={[currentScores[d.key]]} onValueChange={(val) => { const v = Array.isArray(val) ? val[0] : val; setCurrentScores(s => ({...s, [d.key]: v})); }} />
                </div>
              ))}
              <Button className="w-full gap-1.5" onClick={handleSave}><Save className="h-3.5 w-3.5" />Save Assessment</Button>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Current Scores</h3>
              {latestScores.map(s => (
                <div key={s.key} className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm">{s.dimension}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(s.score / 5) * 100}%` }} /></div>
                    <span className="text-sm font-mono font-bold w-6 text-right">{s.score || '—'}</span>
                  </div>
                </div>
              ))}
              {scores.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No assessments yet. Click &ldquo;New Assessment&rdquo; to get started.</p>}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
