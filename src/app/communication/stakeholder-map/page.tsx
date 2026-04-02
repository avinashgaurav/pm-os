'use client';
import { useState, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { useLiveQuery } from 'dexie-react-hooks';
import { toast } from 'sonner';
import { Plus, X, Users2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { db } from '@/lib/db';
import { AIAnalysisButton } from '@/components/shared/ai-analysis';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const quadrants = [
  { key: 'manage-closely', label: 'Manage Closely', description: 'High Influence, High Interest', color: '#ef4444', bg: 'rgba(239,68,68,0.05)' },
  { key: 'keep-satisfied', label: 'Keep Satisfied', description: 'High Influence, Low Interest', color: '#f59e0b', bg: 'rgba(245,158,11,0.05)' },
  { key: 'keep-informed', label: 'Keep Informed', description: 'Low Influence, High Interest', color: '#6366f1', bg: 'rgba(99,102,241,0.05)' },
  { key: 'monitor', label: 'Monitor', description: 'Low Influence, Low Interest', color: '#10b981', bg: 'rgba(16,185,129,0.05)' },
];

function getQuadrant(influence: number, interest: number) {
  if (influence >= 3 && interest >= 3) return 'manage-closely';
  if (influence >= 3 && interest < 3) return 'keep-satisfied';
  if (influence < 3 && interest >= 3) return 'keep-informed';
  return 'monitor';
}

export default function StakeholderMapPage() {
  const stakeholders = useLiveQuery(() => db.stakeholders.toArray()) ?? [];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', role: '', influence: 3, interest: 3, strategy: '', notes: '' });

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) { toast.error('Name required'); return; }
    await db.stakeholders.add({ id: nanoid(), ...form, createdAt: new Date().toISOString() });
    setForm({ name: '', role: '', influence: 3, interest: 3, strategy: '', notes: '' });
    setDialogOpen(false); toast.success('Stakeholder added');
  }, [form]);

  return (
    <div>
      <PageHeader title="Stakeholder Map" description="Map stakeholders by influence and interest"
        actions={<Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5"><Plus className="h-3.5 w-3.5" />Add Stakeholder</Button>} />
      <div className="relative ml-4 mb-8">
        <div className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Influence →</div>
        <div className="absolute bottom-[-24px] left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Interest →</div>
        <div className="grid grid-cols-2 gap-3">
          {quadrants.map(q => {
            const qStakeholders = stakeholders.filter(s => getQuadrant(s.influence, s.interest) === q.key);
            return (
              <motion.div key={q.key} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl border border-border p-4 min-h-[200px]" style={{ background: q.bg }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: q.color }} />
                  <h3 className="text-xs font-semibold" style={{ color: q.color }}>{q.label}</h3>
                  <span className="text-[9px] text-muted-foreground">{q.description}</span>
                </div>
                <div className="space-y-1.5">
                  {qStakeholders.map(s => (
                    <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="group flex items-center justify-between rounded-md bg-background/60 px-2.5 py-1.5">
                      <div><div className="text-xs font-medium">{s.name}</div>{s.role && <div className="text-[10px] text-muted-foreground">{s.role}</div>}</div>
                      <button onClick={async () => { await db.stakeholders.delete(s.id); toast.success('Removed'); }} className="opacity-0 group-hover:opacity-100"><X className="h-3 w-3 text-muted-foreground" /></button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Stakeholder</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Name *</Label><Input className="mt-1" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} /></div>
            <div><Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Role</Label><Input className="mt-1" value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))} placeholder="VP Engineering" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Influence (1-5)</Label>
                <Select value={String(form.influence)} onValueChange={(v: string | null) => setForm(f => ({...f, influence: Number(v)}))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Interest (1-5)</Label>
                <Select value={String(form.interest)} onValueChange={(v: string | null) => setForm(f => ({...f, interest: Number(v)}))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <Button className="w-full" onClick={handleSave}>Add Stakeholder</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Analysis */}
      <div className="mt-6">
        <AIAnalysisButton category="communication" moduleSlug="stakeholder-map" buttonLabel="AI: Engagement Plan"
          getData={() => {
            try { return stakeholders.map(s => `${s.name} (${s.role}) - influence:${s.influence} interest:${s.interest}`).join('\n'); } catch { return ''; }
          }} />
      </div>
    </div>
  );
}
