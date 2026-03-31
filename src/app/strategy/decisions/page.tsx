'use client';

import { useState, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { useLiveQuery } from 'dexie-react-hooks';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, MoreHorizontal, CheckCircle2, Clock, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
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
import type { Decision } from '@/types';

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-500 bg-yellow-500/10' },
  decided: { label: 'Decided', icon: CheckCircle2, color: 'text-green-500 bg-green-500/10' },
  revisiting: { label: 'Revisiting', icon: RotateCcw, color: 'text-blue-500 bg-blue-500/10' },
};

export default function DecisionLogPage() {
  const decisions = useLiveQuery(() => db.decisions.orderBy('createdAt').reverse().toArray()) ?? [];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', context: '', outcome: '', status: 'pending' as Decision['status'] });
  const [filter, setFilter] = useState<string>('all');

  const resetForm = useCallback(() => {
    setForm({ title: '', context: '', outcome: '', status: 'pending' });
    setEditingId(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    const now = new Date().toISOString();
    if (editingId) {
      await db.decisions.update(editingId, { ...form, updatedAt: now });
      toast.success('Decision updated');
    } else {
      await db.decisions.add({
        id: nanoid(), ...form, options: [], chosenOptionId: '', stakeholders: [],
        date: now, tags: [], linkedDocumentIds: [], createdAt: now, updatedAt: now,
      });
      toast.success('Decision logged');
    }
    resetForm();
    setDialogOpen(false);
  }, [form, editingId, resetForm]);

  const handleEdit = useCallback((d: Decision) => {
    setForm({ title: d.title, context: d.context, outcome: d.outcome, status: d.status });
    setEditingId(d.id);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await db.decisions.delete(id);
    toast.success('Decision deleted');
  }, []);

  const handleStatusChange = useCallback(async (id: string, status: Decision['status']) => {
    await db.decisions.update(id, { status, updatedAt: new Date().toISOString() });
  }, []);

  const filtered = filter === 'all' ? decisions : decisions.filter(d => d.status === filter);

  return (
    <div>
      <PageHeader title="Decision Log" description="Track all product decisions with context and outcomes"
        actions={<Button size="sm" onClick={() => { resetForm(); setDialogOpen(true); }} className="gap-1.5"><Plus className="h-3.5 w-3.5" />Log Decision</Button>}
      />

      <div className="flex items-center gap-2 mb-6">
        {['all', 'pending', 'decided', 'revisiting'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}>
            {s === 'all' ? 'All' : statusConfig[s as keyof typeof statusConfig].label} {s === 'all' ? `(${decisions.length})` : `(${decisions.filter(d => d.status === s).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No decisions yet" description="Start logging your product decisions to build institutional knowledge." actionLabel="Log Decision" onAction={() => { resetForm(); setDialogOpen(true); }} />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((d) => {
              const sc = statusConfig[d.status];
              const StatusIcon = sc.icon;
              return (
                <motion.div key={d.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="group rounded-xl border border-border p-5 hover:bg-accent/20 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold">{d.title}</h3>
                        <Badge className={`h-5 px-1.5 text-[10px] font-medium border-0 ${sc.color}`}><StatusIcon className="h-3 w-3 mr-0.5" />{sc.label}</Badge>
                      </div>
                      {d.context && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{d.context}</p>}
                      {d.outcome && <p className="text-xs text-foreground/70"><span className="font-medium">Outcome:</span> {d.outcome}</p>}
                      <p className="text-[10px] text-muted-foreground/60 mt-2">{formatDistanceToNow(new Date(d.createdAt), { addSuffix: true })}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-accent">
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(d)}><Edit2 className="h-3.5 w-3.5 mr-2" />Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(d.id, 'pending')}>Mark Pending</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(d.id, 'decided')}>Mark Decided</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(d.id, 'revisiting')}>Mark Revisiting</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(d.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? 'Edit Decision' : 'Log Decision'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Title *</Label><Input className="mt-1" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="What decision was made?" /></div>
            <div><Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Context</Label><Textarea className="mt-1" rows={3} value={form.context} onChange={e => setForm(f => ({...f, context: e.target.value}))} placeholder="Why was this decision needed? What were the options?" /></div>
            <div><Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Outcome</Label><Textarea className="mt-1" rows={2} value={form.outcome} onChange={e => setForm(f => ({...f, outcome: e.target.value}))} placeholder="What was the result?" /></div>
            <div><Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Status</Label>
              <Select value={form.status} onValueChange={(v: string | null) => setForm(f => ({...f, status: v as Decision['status']}))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="decided">Decided</SelectItem><SelectItem value="revisiting">Revisiting</SelectItem></SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleSave}>Save Decision</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
