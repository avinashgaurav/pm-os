'use client';
import { useState } from 'react';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { AIAnalysisButton } from '@/components/shared/ai-analysis';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
interface SprintData {
  id: string;
  name: string;
  planned: number;
  completed: number;
}
export default function VelocityPage() {
  const [sprints, setSprints] = useState<SprintData[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', planned: 20, completed: 18 });
  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error('Name required');
      return;
    }
    setSprints((p) => [...p, { id: nanoid(), ...form }]);
    setForm({ name: '', planned: 20, completed: 18 });
    setDialogOpen(false);
    toast.success('Added');
  };
  const avg = sprints.length
    ? Math.round(sprints.reduce((s, sp) => s + sp.completed, 0) / sprints.length)
    : 0;
  return (
    <div>
      <PageHeader
        title="Sprint Velocity"
        description="Track sprint velocity over time"
        actions={
          <>
            <AIAnalysisButton
              category="planning"
              moduleSlug="velocity"
              buttonLabel="AI: Forecast"
              getData={() =>
                sprints
                  .map((s) => `${s.name}: planned=${s.planned} completed=${s.completed}`)
                  .join('\n')
              }
            />
            <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add Sprint
            </Button>
          </>
        }
      />
      {sprints.length === 0 ? (
        <div className="surface hairline rounded-2xl p-12 text-center text-sm text-muted-foreground">
          Add sprints to see velocity chart
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="surface hairline rounded-2xl p-4 text-center">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Avg Velocity
              </p>
              <p className="text-2xl font-bold font-mono text-primary">{avg}</p>
            </div>
            <div className="surface hairline rounded-2xl p-4 text-center">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Sprints</p>
              <p className="text-2xl font-bold font-mono">{sprints.length}</p>
            </div>
          </div>
          <div className="surface hairline rounded-2xl p-6 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sprints} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  dataKey="planned"
                  name="Planned"
                  fill="rgba(255,255,255,0.1)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar dataKey="completed" name="Completed" fill="#00C68C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Sprint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Sprint Name</Label>
              <Input
                className="mt-1"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Sprint 14"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Planned</Label>
                <Input
                  type="number"
                  className="mt-1"
                  value={form.planned}
                  onChange={(e) => setForm((f) => ({ ...f, planned: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label className="text-xs">Completed</Label>
                <Input
                  type="number"
                  className="mt-1"
                  value={form.completed}
                  onChange={(e) => setForm((f) => ({ ...f, completed: Number(e.target.value) }))}
                />
              </div>
            </div>
            <Button className="w-full" onClick={handleSave}>
              Add Sprint
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
