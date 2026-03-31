'use client';
import { useState, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { useLiveQuery } from 'dexie-react-hooks';
import { toast } from 'sonner';
import { Plus, Trash2, Target, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { OKR, KeyResult } from '@/types';

export default function OKRTrackerPage() {
  const okrs = useLiveQuery(() => db.okrs.orderBy('createdAt').reverse().toArray()) ?? [];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ objective: '', quarter: 'Q2', year: 2026, keyResults: [{ id: nanoid(), title: '', current: 0, target: 100, unit: '%' }] as KeyResult[] });

  const toggleExpand = (id: string) => setExpanded(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const addKR = () => setForm(f => ({...f, keyResults: [...f.keyResults, { id: nanoid(), title: '', current: 0, target: 100, unit: '%' }]}));
  const updateKR = (idx: number, field: keyof KeyResult, value: string | number) => setForm(f => ({...f, keyResults: f.keyResults.map((kr, i) => i === idx ? {...kr, [field]: value} : kr)}));
  const removeKR = (idx: number) => setForm(f => ({...f, keyResults: f.keyResults.filter((_, i) => i !== idx)}));

  const handleSave = useCallback(async () => {
    if (!form.objective.trim()) { toast.error('Objective required'); return; }
    const progress = form.keyResults.length ? Math.round(form.keyResults.reduce((sum, kr) => sum + Math.min((kr.current / kr.target) * 100, 100), 0) / form.keyResults.length) : 0;
    const now = new Date().toISOString();
    await db.okrs.add({ id: nanoid(), ...form, progress, createdAt: now, updatedAt: now });
    setForm({ objective: '', quarter: 'Q2', year: 2026, keyResults: [{ id: nanoid(), title: '', current: 0, target: 100, unit: '%' }] });
    setDialogOpen(false); toast.success('OKR created');
  }, [form]);

  const updateKRProgress = useCallback(async (okrId: string, krId: string, current: number) => {
    const okr = await db.okrs.get(okrId);
    if (!okr) return;
    const krs = okr.keyResults.map(kr => kr.id === krId ? {...kr, current} : kr);
    const progress = Math.round(krs.reduce((sum, kr) => sum + Math.min((kr.current / kr.target) * 100, 100), 0) / krs.length);
    await db.okrs.update(okrId, { keyResults: krs, progress, updatedAt: new Date().toISOString() });
  }, []);

  return (
    <div>
      <PageHeader title="OKR Tracker" description="Track OKR progress with visual indicators" isNew
        actions={<Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5"><Plus className="h-3.5 w-3.5" />New OKR</Button>} />
      {okrs.length === 0 ? <EmptyState title="No OKRs yet" description="Create your first OKR" actionLabel="New OKR" onAction={() => setDialogOpen(true)} icon={<Target className="h-7 w-7 text-muted-foreground" />} /> : (
        <div className="space-y-3">
          {okrs.map(okr => {
            const isExpanded = expanded.has(okr.id);
            const progressColor = okr.progress >= 70 ? '#10b981' : okr.progress >= 40 ? '#f59e0b' : '#ef4444';
            return (
              <motion.div key={okr.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border overflow-hidden">
                <button onClick={() => toggleExpand(okr.id)} className="w-full flex items-center gap-3 p-4 hover:bg-accent/20 transition-colors text-left">
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold truncate">{okr.objective}</h3>
                      <span className="text-[10px] text-muted-foreground shrink-0">{okr.quarter} {okr.year}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <Progress value={okr.progress} className="h-1.5 flex-1" />
                      <span className="text-xs font-mono font-bold shrink-0" style={{ color: progressColor }}>{okr.progress}%</span>
                    </div>
                  </div>
                  <button onClick={async (e) => { e.stopPropagation(); await db.okrs.delete(okr.id); toast.success('Deleted'); }} className="p-1 rounded hover:bg-accent opacity-0 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-4 pt-0 border-t border-border/50 space-y-2">
                        {okr.keyResults.map((kr, i) => {
                          const pct = Math.min(Math.round((kr.current / kr.target) * 100), 100);
                          return (
                            <div key={kr.id} className="flex items-center gap-3 py-2">
                              <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                              <span className="text-sm flex-1">{kr.title || 'Untitled KR'}</span>
                              <div className="flex items-center gap-2">
                                <Input type="number" className="w-16 h-7 text-xs" value={kr.current}
                                  onChange={e => updateKRProgress(okr.id, kr.id, Number(e.target.value))} />
                                <span className="text-xs text-muted-foreground">/ {kr.target} {kr.unit}</span>
                                <span className="text-xs font-mono font-bold w-10 text-right" style={{ color: pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444' }}>{pct}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New OKR</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Objective *</Label><Input className="mt-1" value={form.objective} onChange={e => setForm(f => ({...f, objective: e.target.value}))} placeholder="What do you want to achieve?" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Quarter</Label><Input className="mt-1" value={form.quarter} onChange={e => setForm(f => ({...f, quarter: e.target.value}))} /></div>
              <div><Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Year</Label><Input type="number" className="mt-1" value={form.year} onChange={e => setForm(f => ({...f, year: Number(e.target.value)}))} /></div>
            </div>
            <div>
              <div className="flex items-center justify-between"><Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Key Results</Label><Button variant="ghost" size="sm" onClick={addKR} className="text-xs h-6">+ Add KR</Button></div>
              <div className="space-y-2 mt-2">
                {form.keyResults.map((kr, i) => (
                  <div key={kr.id} className="flex items-center gap-2">
                    <Input className="flex-1" value={kr.title} onChange={e => updateKR(i, 'title', e.target.value)} placeholder={`Key Result ${i + 1}`} />
                    <Input type="number" className="w-16" value={kr.target} onChange={e => updateKR(i, 'target', Number(e.target.value))} />
                    <Input className="w-12" value={kr.unit} onChange={e => updateKR(i, 'unit', e.target.value)} />
                    {form.keyResults.length > 1 && <button onClick={() => removeKR(i)}><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></button>}
                  </div>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={handleSave}>Create OKR</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
