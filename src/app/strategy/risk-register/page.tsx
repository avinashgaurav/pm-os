'use client';
import { useState, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { useLiveQuery } from 'dexie-react-hooks';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, MoreHorizontal, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/db';
import { AIAnalysisButton } from '@/components/shared/ai-analysis';
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
import type { RiskItem } from '@/types';

const severityColors = ['', 'bg-green-500/20 text-green-400', 'bg-yellow-500/20 text-yellow-400', 'bg-orange-500/20 text-orange-400', 'bg-red-500/20 text-red-400', 'bg-red-600/20 text-red-300'];
const statusColors = { open: 'bg-red-500/10 text-red-400', mitigating: 'bg-yellow-500/10 text-yellow-400', accepted: 'bg-blue-500/10 text-blue-400', closed: 'bg-green-500/10 text-green-400' };

export default function RiskRegisterPage() {
  const risks = useLiveQuery(() => db.risks.orderBy('createdAt').reverse().toArray()) ?? [];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', category: 'technical' as RiskItem['category'], severity: 3, likelihood: 3, mitigation: '', owner: '', status: 'open' as RiskItem['status'] });
  const resetForm = useCallback(() => { setForm({ title: '', description: '', category: 'technical', severity: 3, likelihood: 3, mitigation: '', owner: '', status: 'open' }); setEditingId(null); }, []);
  const handleSave = useCallback(async () => {
    if (!form.title.trim()) { toast.error('Title required'); return; }
    const now = new Date().toISOString();
    const data = { ...form, riskScore: form.severity * form.likelihood };
    if (editingId) { await db.risks.update(editingId, { ...data, updatedAt: now }); toast.success('Updated'); }
    else { await db.risks.add({ id: nanoid(), ...data, createdAt: now, updatedAt: now }); toast.success('Risk added'); }
    resetForm(); setDialogOpen(false);
  }, [form, editingId, resetForm]);

  return (
    <div>
      <PageHeader title="Risk Register" description="Track and manage product risks with severity and likelihood scoring"
        actions={<Button size="sm" onClick={() => { resetForm(); setDialogOpen(true); }} className="gap-1.5"><Plus className="h-3.5 w-3.5" />Add Risk</Button>} />
      {risks.length === 0 ? <EmptyState title="No risks tracked" description="Add risks to proactively manage them" actionLabel="Add Risk" onAction={() => { resetForm(); setDialogOpen(true); }} icon={<ShieldAlert className="h-7 w-7 text-muted-foreground" />} /> : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Risk</th>
              <th className="text-center px-3 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Severity</th>
              <th className="text-center px-3 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Likelihood</th>
              <th className="text-center px-3 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Score</th>
              <th className="text-center px-3 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Status</th>
              <th className="w-10"></th>
            </tr></thead>
            <tbody>
              <AnimatePresence>
                {risks.sort((a, b) => b.riskScore - a.riskScore).map(r => (
                  <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-b border-border/50 hover:bg-accent/20 group">
                    <td className="px-4 py-3"><div className="font-medium">{r.title}</div>{r.description && <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{r.description}</div>}</td>
                    <td className="text-center px-3"><Badge className={`${severityColors[r.severity]} border-0 font-mono`}>{r.severity}</Badge></td>
                    <td className="text-center px-3"><Badge className={`${severityColors[r.likelihood]} border-0 font-mono`}>{r.likelihood}</Badge></td>
                    <td className="text-center px-3"><span className="font-mono font-bold text-sm">{r.riskScore}</span></td>
                    <td className="text-center px-3"><Badge className={`${statusColors[r.status]} border-0 text-[10px]`}>{r.status}</Badge></td>
                    <td className="px-2">
                      <DropdownMenu><DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent"><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setForm({ title: r.title, description: r.description, category: r.category, severity: r.severity, likelihood: r.likelihood, mitigation: r.mitigation, owner: r.owner, status: r.status }); setEditingId(r.id); setDialogOpen(true); }}><Edit2 className="h-3.5 w-3.5 mr-2" />Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={async () => { await db.risks.delete(r.id); toast.success('Deleted'); }} className="text-destructive"><Trash2 className="h-3.5 w-3.5 mr-2" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? 'Edit Risk' : 'Add Risk'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Title *</Label><Input className="mt-1" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Risk title" /></div>
            <div><Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Description</Label><Textarea className="mt-1" rows={2} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Severity (1-5)</Label>
                <Select value={String(form.severity)} onValueChange={(v: string | null) => setForm(f => ({...f, severity: Number(v)}))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Likelihood (1-5)</Label>
                <Select value={String(form.likelihood)} onValueChange={(v: string | null) => setForm(f => ({...f, likelihood: Number(v)}))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Mitigation</Label><Textarea className="mt-1" rows={2} value={form.mitigation} onChange={e => setForm(f => ({...f, mitigation: e.target.value}))} placeholder="How will this risk be mitigated?" /></div>
            <div><Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Status</Label>
              <Select value={form.status} onValueChange={(v: string | null) => setForm(f => ({...f, status: v as RiskItem['status']}))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>
                  <SelectItem value="open">Open</SelectItem><SelectItem value="mitigating">Mitigating</SelectItem><SelectItem value="accepted">Accepted</SelectItem><SelectItem value="closed">Closed</SelectItem>
                </SelectContent></Select></div>
            <Button className="w-full" onClick={handleSave}>Save Risk</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Analysis */}
      <div className="mt-6">
        <AIAnalysisButton category="strategy" moduleSlug="risk-register" buttonLabel="AI: Review Risks"
          getData={() => {
            try { return risks.map(r => `${r.title} (Severity:${r.severity} Likelihood:${r.likelihood}) - ${r.status}: ${r.mitigation}`).join('\n'); } catch { return ''; }
          }} />
      </div>
    </div>
  );
}
