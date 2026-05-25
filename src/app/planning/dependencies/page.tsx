'use client';
import { useState } from 'react';
import { nanoid } from 'nanoid';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { AIAnalysisButton } from '@/components/shared/ai-analysis';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
interface Dep {
  id: string;
  from: string;
  to: string;
}
export default function DependenciesPage() {
  const [deps, setDeps] = useState<Dep[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ from: '', to: '' });
  const handleSave = () => {
    if (!form.from.trim() || !form.to.trim()) {
      toast.error('Both fields required');
      return;
    }
    setDeps((p) => [...p, { id: nanoid(), ...form }]);
    setForm({ from: '', to: '' });
    setDialogOpen(false);
    toast.success('Added');
  };
  return (
    <div>
      <PageHeader
        title="Dependency Map"
        description="Visualize feature and team dependencies"
        actions={
          <>
            <AIAnalysisButton
              category="planning"
              moduleSlug="dependencies"
              buttonLabel="AI: Critical Path"
              getData={() => deps.map((d) => `${d.from} → ${d.to}`).join('\n')}
            />
            <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </>
        }
      />
      {deps.length === 0 ? (
        <EmptyState
          title="No dependencies"
          description="Map feature and team dependencies"
          actionLabel="Add Dependency"
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        <div className="space-y-2">
          {deps.map((d) => (
            <div
              key={d.id}
              className="group flex items-center gap-3 surface hairline rounded-xl px-5 py-3"
            >
              <span className="text-sm font-medium px-3 py-1 rounded-lg surface-card hairline text-foreground">
                {d.from}
              </span>
              <div className="flex items-center gap-1 text-muted-foreground">
                <div className="w-8 h-px bg-border" />
                <ArrowRight className="h-3.5 w-3.5" />
                <div className="w-8 h-px bg-border" />
              </div>
              <span className="text-sm font-medium px-3 py-1 rounded-lg surface-card hairline text-foreground">
                {d.to}
              </span>
              <button
                onClick={() => {
                  setDeps((p) => p.filter((x) => x.id !== d.id));
                  toast.success('Deleted');
                }}
                className="ml-auto opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent"
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Dependency</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={form.from}
              onChange={(e) => setForm((f) => ({ ...f, from: e.target.value }))}
              placeholder="Feature / Team A"
            />
            <div className="text-center text-xs text-muted-foreground">depends on</div>
            <Input
              value={form.to}
              onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))}
              placeholder="Feature / Team B"
            />
            <Button className="w-full" onClick={handleSave}>
              Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
