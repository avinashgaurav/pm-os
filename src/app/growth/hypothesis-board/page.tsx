'use client';
import { useState, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { useLiveQuery } from 'dexie-react-hooks';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, MoreHorizontal, Beaker } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Hypothesis } from '@/types';

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-zinc-500/10 text-zinc-400' },
  testing: { label: 'Testing', color: 'bg-blue-500/10 text-blue-400' },
  validated: { label: 'Validated', color: 'bg-green-500/10 text-green-400' },
  invalidated: { label: 'Invalidated', color: 'bg-red-500/10 text-red-400' },
};

export default function HypothesisBoardPage() {
  const items = useLiveQuery(() => db.hypotheses.orderBy('createdAt').reverse().toArray()) ?? [];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', statement: '', metric: '', baseline: '', target: '', experiment: '', result: '' });
  const resetForm = useCallback(() => { setForm({ title: '', statement: '', metric: '', baseline: '', target: '', experiment: '', result: '' }); setEditingId(null); }, []);
  const handleSave = useCallback(async () => {
    if (!form.title.trim()) { toast.error('Title required'); return; }
    const now = new Date().toISOString();
    if (editingId) { await db.hypotheses.update(editingId, { ...form, updatedAt: now }); toast.success('Updated'); }
    else { await db.hypotheses.add({ id: nanoid(), ...form, status: 'draft', tags: [], createdAt: now, updatedAt: now }); toast.success('Added'); }
    resetForm(); setDialogOpen(false);
  }, [form, editingId, resetForm]);
  const columns = ['draft', 'testing', 'validated', 'invalidated'] as const;

  return (
    <div>
      <PageHeader title="Hypothesis Board" description="Track product hypotheses and experiments"
        actions={<Button size="sm" onClick={() => { resetForm(); setDialogOpen(true); }} className="gap-1.5"><Plus className="h-3.5 w-3.5" />Add Hypothesis</Button>} />
      <div className="grid grid-cols-4 gap-4">
        {columns.map(col => {
          const sc = statusConfig[col];
          const colItems = items.filter(h => h.status === col);
          return (
            <div key={col} className="rounded-xl border border-border bg-card/50 p-3">
              <div className="flex items-center justify-between mb-3"><Badge className={`${sc.color} border-0 text-xs`}>{sc.label}</Badge><span className="text-[10px] text-muted-foreground font-mono">{colItems.length}</span></div>
              <div className="space-y-2 min-h-[200px]">
                <AnimatePresence>
                  {colItems.map(h => (
                    <motion.div key={h.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      className="group rounded-lg border border-border p-3 bg-background hover:bg-accent/20 transition-colors">
                      <div className="flex items-start justify-between">
                        <h4 className="text-xs font-medium">{h.title}</h4>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-accent"><MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" /></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setForm({ title: h.title, statement: h.statement, metric: h.metric, baseline: h.baseline, target: h.target, experiment: h.experiment, result: h.result || '' }); setEditingId(h.id); setDialogOpen(true); }}>Edit</DropdownMenuItem>
                            {columns.filter(c => c !== col).map(c => <DropdownMenuItem key={c} onClick={async () => { await db.hypotheses.update(h.id, { status: c, updatedAt: new Date().toISOString() }); }}>Move to {statusConfig[c].label}</DropdownMenuItem>)}
                            <DropdownMenuItem onClick={async () => { await db.hypotheses.delete(h.id); toast.success('Deleted'); }} className="text-destructive">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {h.statement && <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1">{h.statement}</p>}
                      {h.metric && <p className="text-[9px] text-muted-foreground/60 mt-1.5">Metric: {h.metric}</p>}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? 'Edit' : 'Add'} Hypothesis</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Title *</Label><Input className="mt-1" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Hypothesis title" /></div>
            <div><Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Hypothesis Statement</Label><Textarea className="mt-1" rows={2} value={form.statement} onChange={e => setForm(f => ({...f, statement: e.target.value}))} placeholder="We believe that [change] will result in [outcome] because [reason]" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-[10px]">Metric</Label><Input className="mt-1" value={form.metric} onChange={e => setForm(f => ({...f, metric: e.target.value}))} placeholder="Conversion rate" /></div>
              <div><Label className="text-[10px]">Baseline</Label><Input className="mt-1" value={form.baseline} onChange={e => setForm(f => ({...f, baseline: e.target.value}))} placeholder="2.5%" /></div>
              <div><Label className="text-[10px]">Target</Label><Input className="mt-1" value={form.target} onChange={e => setForm(f => ({...f, target: e.target.value}))} placeholder="3.5%" /></div>
            </div>
            <div><Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Experiment Design</Label><Textarea className="mt-1" rows={2} value={form.experiment} onChange={e => setForm(f => ({...f, experiment: e.target.value}))} placeholder="How will you test this?" /></div>
            <Button className="w-full" onClick={handleSave}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
