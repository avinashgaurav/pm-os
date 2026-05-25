'use client';
import { useState } from 'react';
import { nanoid } from 'nanoid';
import { Plus, Trash2, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { AIAnalysisButton } from '@/components/shared/ai-analysis';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusPill, type StatusVariant } from '@/components/ui/status-pill';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
interface BacklogItem {
  id: string;
  title: string;
  priority: string;
  status: string;
  effort: string;
}
const priorities: { value: string; label: string; variant: StatusVariant }[] = [
  { value: 'P0', label: 'P0 — Critical', variant: 'p0' },
  { value: 'P1', label: 'P1 — High', variant: 'p1' },
  { value: 'P2', label: 'P2 — Medium', variant: 'p2' },
  { value: 'P3', label: 'P3 — Low', variant: 'p3' },
];
const statuses: { value: string; label: string; variant: StatusVariant }[] = [
  { value: 'todo', label: 'To Do', variant: 'todo' },
  { value: 'in-progress', label: 'In Progress', variant: 'progress' },
  { value: 'done', label: 'Done', variant: 'done' },
];
export default function BacklogPage() {
  const [items, setItems] = useState<BacklogItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: '', priority: 'P2', status: 'todo', effort: 'M' });
  const handleSave = () => {
    if (!form.title.trim()) {
      toast.error('Title required');
      return;
    }
    setItems((p) => [...p, { id: nanoid(), ...form }]);
    setForm({ title: '', priority: 'P2', status: 'todo', effort: 'M' });
    setDialogOpen(false);
    toast.success('Added');
  };
  const sorted = [...items].sort((a, b) => a.priority.localeCompare(b.priority));
  const gp = (v: string) => priorities.find((p) => p.value === v);
  const gs = (v: string) => statuses.find((s) => s.value === v);
  return (
    <div>
      <PageHeader
        title="Backlog Prioritizer"
        description="Prioritize and manage your product backlog"
        actions={
          <>
            <AIAnalysisButton
              category="planning"
              moduleSlug="backlog"
              buttonLabel="AI: Prioritize"
              getData={() => items.map((i) => `${i.priority} ${i.title} (${i.status})`).join('\n')}
            />
            <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add Item
            </Button>
          </>
        }
      />
      {sorted.length === 0 ? (
        <EmptyState
          title="Backlog empty"
          description="Add items to your backlog"
          actionLabel="Add Item"
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        <div className="space-y-2">
          {sorted.map((item) => (
            <div
              key={item.id}
              className="group flex items-center gap-3 surface hairline rounded-xl px-4 py-3"
            >
              <StatusPill
                variant={gp(item.priority)?.variant ?? 'p2'}
                label={item.priority}
                className="shrink-0"
              />
              <span className="text-sm flex-1">{item.title}</span>
              <span className="text-[10px] font-mono text-muted-foreground/50">{item.effort}</span>
              <StatusPill
                variant={gs(item.status)?.variant ?? 'todo'}
                label={gs(item.status)?.label}
              />
              <DropdownMenu>
                <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent">
                  <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {statuses.map((s) => (
                    <DropdownMenuItem
                      key={s.value}
                      onClick={() =>
                        setItems((p) =>
                          p.map((i) => (i.id === item.id ? { ...i, status: s.value } : i))
                        )
                      }
                    >
                      {s.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem
                    onClick={() => {
                      setItems((p) => p.filter((i) => i.id !== item.id));
                      toast.success('Deleted');
                    }}
                    className="text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Backlog Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Item title"
            />
            <div className="grid grid-cols-3 gap-3">
              <Select
                value={form.priority}
                onValueChange={(v: string | null) => {
                  if (v) setForm((f) => ({ ...f, priority: v }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={form.effort}
                onValueChange={(v: string | null) => {
                  if (v) setForm((f) => ({ ...f, effort: v }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['XS', 'S', 'M', 'L', 'XL'].map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={form.status}
                onValueChange={(v: string | null) => {
                  if (v) setForm((f) => ({ ...f, status: v }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleSave}>
              Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
