'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  MoreHorizontal,
  FlaskConical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import type { FeatureScore } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

// ---- Types ----

type Framework = 'rice' | 'ice';
type SortDir = 'asc' | 'desc';
type SortField =
  | 'title'
  | 'reach'
  | 'impact'
  | 'confidence'
  | 'effort'
  | 'riceScore'
  | 'iceImpact'
  | 'iceConfidence'
  | 'iceEase'
  | 'iceScore'
  | 'status';

// ---- Constants ----

const STATUS_OPTIONS = [
  { value: 'proposed', label: 'Proposed', color: 'blue' },
  { value: 'accepted', label: 'Accepted', color: 'green' },
  { value: 'rejected', label: 'Rejected', color: 'red' },
  { value: 'deferred', label: 'Deferred', color: 'yellow' },
] as const;

const statusColorMap: Record<string, string> = {
  proposed: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  accepted: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  rejected: 'bg-red-500/15 text-red-700 dark:text-red-400',
  deferred: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
};

// ---- Helpers ----

function computeRice(reach: number, impact: number, confidence: number, effort: number): number {
  if (effort === 0) return 0;
  return (reach * impact * confidence) / effort;
}

function computeIce(impact: number, confidence: number, ease: number): number {
  return (impact + confidence + ease) / 3;
}

function scoreColor(value: number, max: number): string {
  const ratio = value / max;
  if (ratio >= 0.7) return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400';
  if (ratio >= 0.4) return 'bg-amber-500/15 text-amber-700 dark:text-amber-400';
  return 'bg-red-500/15 text-red-700 dark:text-red-400';
}

function createEmptyFeature(): Omit<FeatureScore, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    title: '',
    description: '',
    reach: 0,
    impact: 0,
    confidence: 0,
    effort: 1,
    riceScore: 0,
    iceImpact: 0,
    iceConfidence: 0,
    iceEase: 0,
    iceScore: 0,
    customScores: [],
    customTotal: 0,
    status: 'proposed',
    tags: [],
  };
}

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15 } },
};

// ---- Score Cell ----

function ScoreCell({ value, max }: { value: number; max: number }) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums min-w-[36px]',
        scoreColor(value, max)
      )}
    >
      {typeof value === 'number' ? value.toFixed(value % 1 !== 0 ? 1 : 0) : value}
    </span>
  );
}

// ---- Feature Dialog ----

function FeatureDialog({
  open,
  onOpenChange,
  feature,
  framework,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: FeatureScore | null;
  framework: Framework;
}) {
  const [form, setForm] = React.useState(createEmptyFeature());

  React.useEffect(() => {
    if (feature) {
      setForm({
        title: feature.title,
        description: feature.description,
        reach: feature.reach,
        impact: feature.impact,
        confidence: feature.confidence,
        effort: feature.effort,
        riceScore: feature.riceScore,
        iceImpact: feature.iceImpact,
        iceConfidence: feature.iceConfidence,
        iceEase: feature.iceEase,
        iceScore: feature.iceScore,
        customScores: feature.customScores,
        customTotal: feature.customTotal,
        status: feature.status,
        tags: feature.tags,
      });
    } else {
      setForm(createEmptyFeature());
    }
  }, [feature, open]);

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const now = new Date().toISOString();
    const rice = computeRice(form.reach, form.impact, form.confidence, form.effort);
    const ice = computeIce(form.iceImpact, form.iceConfidence, form.iceEase);

    if (feature) {
      await db.featureScores.update(feature.id, {
        ...form,
        riceScore: rice,
        iceScore: ice,
        updatedAt: now,
      });
    } else {
      await db.featureScores.add({
        ...form,
        id: crypto.randomUUID(),
        riceScore: rice,
        iceScore: ice,
        createdAt: now,
        updatedAt: now,
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{feature ? 'Edit Feature' : 'New Feature'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
          {/* Title */}
          <div className="grid gap-1.5">
            <Label htmlFor="feat-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="feat-title"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Feature name"
            />
          </div>

          {/* Description */}
          <div className="grid gap-1.5">
            <Label htmlFor="feat-desc">Description</Label>
            <Textarea
              id="feat-desc"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Brief description"
              rows={2}
            />
          </div>

          {/* Status */}
          <div className="grid gap-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(val) => updateField('status', val as FeatureScore['status'])}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* RICE Scores */}
          {framework === 'rice' && (
            <>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">
                RICE Scores
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="feat-reach">Reach (users/quarter)</Label>
                  <Input
                    id="feat-reach"
                    type="number"
                    min={0}
                    value={form.reach}
                    onChange={(e) => updateField('reach', Number(e.target.value))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="feat-impact">Impact (1-3)</Label>
                  <Input
                    id="feat-impact"
                    type="number"
                    min={0}
                    max={3}
                    step={0.5}
                    value={form.impact}
                    onChange={(e) => updateField('impact', Number(e.target.value))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="feat-conf">Confidence (%)</Label>
                  <Input
                    id="feat-conf"
                    type="number"
                    min={0}
                    max={100}
                    value={form.confidence}
                    onChange={(e) => updateField('confidence', Number(e.target.value))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="feat-effort">Effort (person-months)</Label>
                  <Input
                    id="feat-effort"
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={form.effort}
                    onChange={(e) => updateField('effort', Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                RICE Score: <span className="font-semibold text-foreground">{computeRice(form.reach, form.impact, form.confidence, form.effort).toFixed(1)}</span>
                {' '}= (Reach x Impact x Confidence) / Effort
              </div>
            </>
          )}

          {/* ICE Scores */}
          {framework === 'ice' && (
            <>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">
                ICE Scores
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="feat-ice-impact">Impact (1-10)</Label>
                  <Input
                    id="feat-ice-impact"
                    type="number"
                    min={1}
                    max={10}
                    value={form.iceImpact}
                    onChange={(e) => updateField('iceImpact', Number(e.target.value))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="feat-ice-conf">Confidence (1-10)</Label>
                  <Input
                    id="feat-ice-conf"
                    type="number"
                    min={1}
                    max={10}
                    value={form.iceConfidence}
                    onChange={(e) => updateField('iceConfidence', Number(e.target.value))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="feat-ice-ease">Ease (1-10)</Label>
                  <Input
                    id="feat-ice-ease"
                    type="number"
                    min={1}
                    max={10}
                    value={form.iceEase}
                    onChange={(e) => updateField('iceEase', Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                ICE Score: <span className="font-semibold text-foreground">{computeIce(form.iceImpact, form.iceConfidence, form.iceEase).toFixed(1)}</span>
                {' '}= (Impact + Confidence + Ease) / 3
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!form.title.trim()}>
            {feature ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- Main Component ----

export function ScoringTable() {
  const features = useLiveQuery(() => db.featureScores.toArray()) ?? [];
  const [framework, setFramework] = React.useState<Framework>('rice');
  const [sortField, setSortField] = React.useState<SortField>('riceScore');
  const [sortDir, setSortDir] = React.useState<SortDir>('desc');
  const [search, setSearch] = React.useState('');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingFeature, setEditingFeature] = React.useState<FeatureScore | null>(null);

  // Switch default sort when framework changes
  React.useEffect(() => {
    setSortField(framework === 'rice' ? 'riceScore' : 'iceScore');
    setSortDir('desc');
  }, [framework]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const handleAdd = () => {
    setEditingFeature(null);
    setDialogOpen(true);
  };

  const handleEdit = (feature: FeatureScore) => {
    setEditingFeature(feature);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await db.featureScores.delete(id);
  };

  // Filter
  const filtered = React.useMemo(() => {
    if (!search.trim()) return features;
    const q = search.toLowerCase();
    return features.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.status.toLowerCase().includes(q)
    );
  }, [features, search]);

  // Sort
  const sorted = React.useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = a[sortField as keyof FeatureScore];
      const bVal = b[sortField as keyof FeatureScore];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp =
        typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  // Column sort header helper
  const SortHead = ({
    field,
    label,
    className,
  }: {
    field: SortField;
    label: string;
    className?: string;
  }) => (
    <TableHead
      className={cn('cursor-pointer select-none', className)}
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortField === field ? (
          sortDir === 'asc' ? (
            <ArrowUp className="size-3 text-muted-foreground" />
          ) : (
            <ArrowDown className="size-3 text-muted-foreground" />
          )
        ) : (
          <ArrowUpDown className="size-3 text-muted-foreground/40" />
        )}
      </span>
    </TableHead>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
      className="space-y-4"
    >
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search features..."
            className="pl-8 h-8"
          />
          <FlaskConical className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border bg-muted p-0.5">
            <button
              onClick={() => setFramework('rice')}
              className={cn(
                'inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
                framework === 'rice'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              RICE
            </button>
            <button
              onClick={() => setFramework('ice')}
              className={cn(
                'inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
                framework === 'ice'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              ICE
            </button>
          </div>
          <Button size="sm" onClick={handleAdd}>
            <Plus className="size-3.5" />
            Add Feature
          </Button>
        </div>
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
            <FlaskConical className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold mb-1">
            {search ? 'No results found' : 'No features scored yet'}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            {search
              ? 'Try adjusting your search query.'
              : 'Add features and score them using the RICE or ICE framework.'}
          </p>
          {!search && (
            <Button size="sm" onClick={handleAdd}>
              <Plus className="size-3.5" />
              Score first feature
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHead field="title" label="Feature" className="min-w-[180px]" />
                <SortHead field="status" label="Status" />
                {framework === 'rice' ? (
                  <>
                    <SortHead field="reach" label="Reach" />
                    <SortHead field="impact" label="Impact" />
                    <SortHead field="confidence" label="Confidence" />
                    <SortHead field="effort" label="Effort" />
                    <SortHead field="riceScore" label="RICE Score" />
                  </>
                ) : (
                  <>
                    <SortHead field="iceImpact" label="Impact" />
                    <SortHead field="iceConfidence" label="Confidence" />
                    <SortHead field="iceEase" label="Ease" />
                    <SortHead field="iceScore" label="ICE Score" />
                  </>
                )}
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {sorted.map((feature) => (
                  <motion.tr
                    key={feature.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    layout
                    className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleEdit(feature)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">{feature.title}</div>
                        {feature.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {feature.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                          statusColorMap[feature.status] ?? 'bg-muted text-muted-foreground'
                        )}
                      >
                        {STATUS_OPTIONS.find((s) => s.value === feature.status)?.label ?? feature.status}
                      </span>
                    </TableCell>
                    {framework === 'rice' ? (
                      <>
                        <TableCell>
                          <ScoreCell value={feature.reach} max={10000} />
                        </TableCell>
                        <TableCell>
                          <ScoreCell value={feature.impact} max={3} />
                        </TableCell>
                        <TableCell>
                          <ScoreCell value={feature.confidence} max={100} />
                        </TableCell>
                        <TableCell>
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {feature.effort}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              'inline-flex items-center justify-center rounded-md px-2.5 py-0.5 text-xs font-bold tabular-nums min-w-[48px]',
                              scoreColor(feature.riceScore, Math.max(...sorted.map((f) => f.riceScore), 1))
                            )}
                          >
                            {feature.riceScore.toFixed(1)}
                          </span>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>
                          <ScoreCell value={feature.iceImpact} max={10} />
                        </TableCell>
                        <TableCell>
                          <ScoreCell value={feature.iceConfidence} max={10} />
                        </TableCell>
                        <TableCell>
                          <ScoreCell value={feature.iceEase} max={10} />
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              'inline-flex items-center justify-center rounded-md px-2.5 py-0.5 text-xs font-bold tabular-nums min-w-[48px]',
                              scoreColor(feature.iceScore, 10)
                            )}
                          >
                            {feature.iceScore.toFixed(1)}
                          </span>
                        </TableCell>
                      </>
                    )}
                    <TableCell>
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={<Button variant="ghost" size="icon-xs" />}
                          >
                            <MoreHorizontal className="size-3.5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(feature)}>
                              <Pencil />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => handleDelete(feature.id)}
                            >
                              <Trash2 />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      )}

      {/* Footer count */}
      {sorted.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Showing {sorted.length} of {features.length} feature{features.length !== 1 ? 's' : ''}
          {' '}&middot;{' '}
          Framework: <span className="font-medium text-foreground">{framework.toUpperCase()}</span>
        </div>
      )}

      {/* Feature Dialog */}
      <FeatureDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        feature={editingFeature}
        framework={framework}
      />
    </motion.div>
  );
}
