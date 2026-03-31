'use client';
import { useState, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { useLiveQuery } from 'dexie-react-hooks';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, MoreHorizontal, HelpCircle } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Assumption } from '@/types';

const statusConfig = {
  untested: { label: 'Untested', color: 'bg-zinc-500/10 text-zinc-400' },
  testing: { label: 'Testing', color: 'bg-blue-500/10 text-blue-400' },
  validated: { label: 'Validated', color: 'bg-green-500/10 text-green-400' },
  invalidated: { label: 'Invalidated', color: 'bg-red-500/10 text-red-400' },
};

export default function AssumptionTrackerPage() {
  const items = useLiveQuery(() => db.assumptions.orderBy('createdAt').reverse().toArray()) ?? [];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', status: 'untested' as Assumption['status'], confidence: 3, impact: 3, testPlan: '' });
  const [filter, setFilter] = useState('all');
  const resetForm = useCallback(() => { setForm({ title: '', description: '', status: 'untested', confidence: 3, impact: 3, testPlan: '' }); setEditingId(null); }, []);
  const handleSave = useCallback(async () => {
    if (!form.title.trim()) { toast.error('Title required'); return; }
    const now = new Date().toISOString();
    if (editingId) { await db.assumptions.update(editingId, { ...form, evidence: [], tags: [], updatedAt: now }); toast.success('Updated'); }
    else { await db.assumptions.add({ id: nanoid(), ...form, evidence: [], tags: [], createdAt: now, updatedAt: now }); toast.success('Added'); }
    resetForm(); setDialogOpen(false);
  }, [form, editingId, resetForm]);
  const filtered = filter === 'all' ? items : items.filter(a => a.status === filter);
  const columns = ['untested', 'testing', 'validated', 'invalidated'] as const;

  return (
    <div>
      <PageHeader title="Assumption Tracker" description="Track and validate product assumptions"
        actions={<Button size="sm" onClick={() => { resetForm(); setDialogOpen(true); }} className="gap-1.5"><Plus className="h-3.5 w-3.5" />Add Assumption</Button>} />
      <div className="grid grid-cols-4 gap-4">
        {columns.map(col => {
          const sc = statusConfig[col];
          const colItems = items.filter(a => a.status === col);
          return (
            <div key={col} className="rounded-xl border border-border bg-card/50 p-3">
              <div className="flex items-center justify-between mb-3">
                <Badge className={`${sc.color} border-0 text-xs`}>{sc.label}</Badge>
                <span className="text-[10px] text-muted-foreground font-mono">{colItems.length}</span>
              </div>
              <div className="space-y-2 min-h-[200px]">
                <AnimatePresence>
                  {colItems.map(a => (
                    <motion.div key={a.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      className="group rounded-lg border border-border p-3 bg-background hover:bg-accent/20 transition-colors">
                      <div className="flex items-start justify-between">
                        <h4 className="text-xs font-medium">{a.title}</h4>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-accent"><MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" /></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setForm({ title: a.title, description: a.description, status: a.status, confidence: a.confidence, impact: a.impact, testPlan: a.testPlan }); setEditingId(a.id); setDialogOpen(true); }}>Edit</DropdownMenuItem>
                            {columns.filter(c => c !== col).map(c => <DropdownMenuItem key={c} onClick={async () => { await db.assumptions.update(a.id, { status: c, updatedAt: new Date().toISOString() }); }}>Move to {statusConfig[c].label}</DropdownMenuItem>)}
                            <DropdownMenuItem onClick={async () => { await db.assumptions.delete(a.id); toast.success('Deleted'); }} className="text-destructive">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {a.description && <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1">{a.description}</p>}
                      <div className="flex gap-2 mt-2">
                        <span className="text-[9px] text-muted-foreground/60">Impact: {a.impact}/5</span>
                        <span className="text-[9px] text-muted-foreground/60">Confidence: {a.confidence}/5</span>
                      </div>
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
          <DialogHeader><DialogTitle>{editingId ? 'Edit' : 'Add'} Assumption</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Title *</Label><Input className="mt-1" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="We assume that..." /></div>
            <div><Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Description</Label><Textarea className="mt-1" rows={2} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Impact (1-5)</Label>
                <Select value={String(form.impact)} onValueChange={(v: string | null) => setForm(f => ({...f, impact: Number(v)}))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Confidence (1-5)</Label>
                <Select value={String(form.confidence)} onValueChange={(v: string | null) => setForm(f => ({...f, confidence: Number(v)}))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Test Plan</Label><Textarea className="mt-1" rows={2} value={form.testPlan} onChange={e => setForm(f => ({...f, testPlan: e.target.value}))} placeholder="How will you validate this?" /></div>
            <Button className="w-full" onClick={handleSave}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
