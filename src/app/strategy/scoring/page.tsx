'use client';
import { useState, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { useLiveQuery } from 'dexie-react-hooks';
import { toast } from 'sonner';
import { Plus, Trash2, ArrowUpDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function FeatureScoringPage() {
  const features = useLiveQuery(() => db.featureScores.orderBy('createdAt').reverse().toArray()) ?? [];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'rice' | 'ice'>('rice');
  const [form, setForm] = useState({ title: '', description: '', reach: 1000, impact: 2, confidence: 80, effort: 4, iceImpact: 7, iceConfidence: 7, iceEase: 7 });

  const handleSave = useCallback(async () => {
    if (!form.title.trim()) { toast.error('Title required'); return; }
    const now = new Date().toISOString();
    const riceScore = Math.round((form.reach * form.impact * (form.confidence / 100)) / form.effort);
    const iceScore = Math.round((form.iceImpact * form.iceConfidence * form.iceEase) / 10);
    await db.featureScores.add({ id: nanoid(), ...form, riceScore, iceScore, customScores: [], customTotal: 0, status: 'proposed', tags: [], createdAt: now, updatedAt: now });
    setForm({ title: '', description: '', reach: 1000, impact: 2, confidence: 80, effort: 4, iceImpact: 7, iceConfidence: 7, iceEase: 7 });
    setDialogOpen(false); toast.success('Feature scored');
  }, [form]);

  const sorted = [...features].sort((a, b) => sortBy === 'rice' ? b.riceScore - a.riceScore : b.iceScore - a.iceScore);
  const scoreColor = (score: number, max: number) => { const pct = score / max; return pct > 0.7 ? 'text-green-400' : pct > 0.4 ? 'text-yellow-400' : 'text-red-400'; };

  return (
    <div>
      <PageHeader title="Feature Scoring" description="Score features using RICE and ICE frameworks" isNew
        actions={<Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5"><Plus className="h-3.5 w-3.5" />Score Feature</Button>} />
      <Tabs value={sortBy} onValueChange={(v: string | null) => { if (v) setSortBy(v as 'rice' | 'ice'); }} className="mb-4">
        <TabsList><TabsTrigger value="rice">RICE Score</TabsTrigger><TabsTrigger value="ice">ICE Score</TabsTrigger></TabsList>
      </Tabs>
      {sorted.length === 0 ? <EmptyState title="No features scored" description="Add features and score them with RICE or ICE" actionLabel="Score Feature" onAction={() => setDialogOpen(true)} /> : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Feature</th>
              {sortBy === 'rice' ? (<>
                <th className="text-center px-2 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Reach</th>
                <th className="text-center px-2 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Impact</th>
                <th className="text-center px-2 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Conf%</th>
                <th className="text-center px-2 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Effort</th>
                <th className="text-center px-3 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">RICE</th>
              </>) : (<>
                <th className="text-center px-2 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Impact</th>
                <th className="text-center px-2 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Confidence</th>
                <th className="text-center px-2 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Ease</th>
                <th className="text-center px-3 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">ICE</th>
              </>)}
              <th className="w-10"></th>
            </tr></thead>
            <tbody>{sorted.map((f, i) => (
              <motion.tr key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-border/50 hover:bg-accent/20">
                <td className="px-4 py-3"><div className="font-medium">{f.title}</div>{f.description && <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{f.description}</div>}</td>
                {sortBy === 'rice' ? (<>
                  <td className="text-center px-2 font-mono text-xs">{f.reach.toLocaleString()}</td>
                  <td className="text-center px-2 font-mono text-xs">{f.impact}</td>
                  <td className="text-center px-2 font-mono text-xs">{f.confidence}%</td>
                  <td className="text-center px-2 font-mono text-xs">{f.effort}</td>
                  <td className="text-center px-3"><span className={`font-mono font-bold text-sm ${scoreColor(f.riceScore, sorted[0]?.riceScore || 1)}`}>{f.riceScore}</span></td>
                </>) : (<>
                  <td className="text-center px-2 font-mono text-xs">{f.iceImpact}</td>
                  <td className="text-center px-2 font-mono text-xs">{f.iceConfidence}</td>
                  <td className="text-center px-2 font-mono text-xs">{f.iceEase}</td>
                  <td className="text-center px-3"><span className={`font-mono font-bold text-sm ${scoreColor(f.iceScore, sorted[0]?.iceScore || 1)}`}>{f.iceScore}</span></td>
                </>)}
                <td className="px-2"><button onClick={async () => { await db.featureScores.delete(f.id); toast.success('Deleted'); }} className="p-1 rounded hover:bg-accent opacity-0 hover:opacity-100 transition-opacity"><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></button></td>
              </motion.tr>
            ))}</tbody>
          </table>
        </div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Score Feature</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Feature *</Label><Input className="mt-1" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Feature name" /></div>
            <div><Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Description</Label><Input className="mt-1" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Brief description" /></div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-2">RICE Scores</div>
            <div className="grid grid-cols-4 gap-3">
              <div><Label className="text-[10px]">Reach</Label><Input type="number" className="mt-1" value={form.reach} onChange={e => setForm(f => ({...f, reach: Number(e.target.value)}))} /></div>
              <div><Label className="text-[10px]">Impact (0.25-3)</Label><Input type="number" step="0.25" className="mt-1" value={form.impact} onChange={e => setForm(f => ({...f, impact: Number(e.target.value)}))} /></div>
              <div><Label className="text-[10px]">Confidence %</Label><Input type="number" className="mt-1" value={form.confidence} onChange={e => setForm(f => ({...f, confidence: Number(e.target.value)}))} /></div>
              <div><Label className="text-[10px]">Effort (weeks)</Label><Input type="number" className="mt-1" value={form.effort} onChange={e => setForm(f => ({...f, effort: Number(e.target.value)}))} /></div>
            </div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-2">ICE Scores</div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-[10px]">Impact (1-10)</Label><Input type="number" className="mt-1" value={form.iceImpact} onChange={e => setForm(f => ({...f, iceImpact: Number(e.target.value)}))} /></div>
              <div><Label className="text-[10px]">Confidence (1-10)</Label><Input type="number" className="mt-1" value={form.iceConfidence} onChange={e => setForm(f => ({...f, iceConfidence: Number(e.target.value)}))} /></div>
              <div><Label className="text-[10px]">Ease (1-10)</Label><Input type="number" className="mt-1" value={form.iceEase} onChange={e => setForm(f => ({...f, iceEase: Number(e.target.value)}))} /></div>
            </div>
            <Button className="w-full" onClick={handleSave}>Save Score</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
