'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Plus,
  Trash2,
  Save,
  ArrowUp,
  ArrowDown,
  Workflow,
  Check,
  Link2,
  ArrowRight,
  Edit2,
} from 'lucide-react';
import { categories, getAllModules } from '@/lib/constants';
import { db } from '@/lib/db';
import type { WorkflowStep, Workflow as WorkflowType } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

// ---------------------------------------------------------------------------
// Animation presets
// ---------------------------------------------------------------------------
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 0.61, 0.36, 1] as const },
  },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const cardPop = {
  initial: { opacity: 0, scale: 0.96, y: 12 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 0.61, 0.36, 1] as const },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: -8,
    transition: { duration: 0.2, ease: [0.22, 0.61, 0.36, 1] as const },
  },
};

// ---------------------------------------------------------------------------
// Module helper — resolve a "category/moduleSlug" path to display info
// ---------------------------------------------------------------------------
function resolveModuleLink(path: string) {
  const [catSlug, modSlug] = path.split('/');
  const cat = categories.find((c) => c.slug === catSlug);
  const mod = cat?.modules.find((m) => m.slug === modSlug);
  if (!cat || !mod) return null;
  return { ...mod, category: cat.slug, categoryName: cat.name, color: cat.color };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Welcome screen shown when no workflow exists yet */
function WelcomeScreen({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] as const }}
      className="max-w-lg mx-auto text-center py-20"
    >
      <div className="flex justify-center mb-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
          <Workflow className="h-8 w-8 text-primary" />
        </div>
      </div>
      <h2 className="text-2xl font-bold tracking-tight mb-3">Workflow Mapper</h2>
      <p className="text-sm text-muted-foreground mb-8 leading-relaxed max-w-md mx-auto">
        Map your PM workflow to get a personalized module list. Define the steps in your product
        process and link the PM OS modules you use at each stage.
      </p>
      <Button size="lg" onClick={onCreate} className="gap-2">
        <Plus className="h-4 w-4" />
        Create My Workflow
      </Button>
    </motion.div>
  );
}

/** Dialog to link modules to a step */
function LinkModulesDialog({
  step,
  onToggle,
}: {
  step: WorkflowStep;
  onToggle: (path: string) => void;
}) {
  const allModules = useMemo(() => getAllModules(), []);
  const grouped = useMemo(() => {
    const map: Record<string, typeof allModules> = {};
    for (const m of allModules) {
      if (!map[m.categoryName]) map[m.categoryName] = [];
      map[m.categoryName].push(m);
    }
    return map;
  }, [allModules]);

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Link2 className="h-3.5 w-3.5" />
            Link Modules
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Link Modules to &quot;{step.label}&quot;</DialogTitle>
          <DialogDescription>Select the modules you use during this step.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[50vh] -mx-4 px-4">
          {Object.entries(grouped).map(([catName, modules]) => (
            <div key={catName} className="mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                {catName}
              </p>
              <div className="space-y-1">
                {modules.map((mod) => {
                  const path = `${mod.category}/${mod.slug}`;
                  const isLinked = step.moduleLinks.includes(path);
                  return (
                    <button
                      key={path}
                      type="button"
                      onClick={() => onToggle(path)}
                      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        isLinked
                          ? 'bg-primary/10 text-foreground'
                          : 'hover:bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
                          isLinked
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-border'
                        }`}
                      >
                        {isLinked && <Check className="h-3 w-3" />}
                      </div>
                      <span className="truncate">{mod.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </ScrollArea>
        <DialogFooter showCloseButton>
          <span className="text-xs text-muted-foreground mr-auto">
            {step.moduleLinks.length} module{step.moduleLinks.length !== 1 ? 's' : ''} linked
          </span>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Single step card in edit mode */
function StepCard({
  step,
  index,
  total,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onToggleModule,
}: {
  step: WorkflowStep;
  index: number;
  total: number;
  onUpdate: (id: string, patch: Partial<WorkflowStep>) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onToggleModule: (stepId: string, path: string) => void;
}) {
  const linkedModules = step.moduleLinks.map(resolveModuleLink).filter(Boolean);

  return (
    <motion.div layout {...cardPop} className="surface hairline rounded-2xl p-5">
      <div className="flex items-start gap-4">
        {/* Step number badge */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary font-bold text-sm font-mono">
          {index + 1}
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          {/* Label */}
          <Input
            value={step.label}
            onChange={(e) => onUpdate(step.id, { label: e.target.value })}
            placeholder="Step name, e.g. Discovery"
            className="font-semibold text-sm"
          />

          {/* Description */}
          <Textarea
            value={step.description}
            onChange={(e) => onUpdate(step.id, { description: e.target.value })}
            placeholder="What happens in this step?"
            className="text-sm min-h-[60px]"
          />

          {/* Module links */}
          <div className="flex flex-wrap items-center gap-2">
            <LinkModulesDialog step={step} onToggle={(path) => onToggleModule(step.id, path)} />
            {linkedModules.map((mod) =>
              mod ? (
                <Badge
                  key={`${mod.category}/${mod.slug}`}
                  variant="secondary"
                  className="text-[11px] gap-1"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full inline-block"
                    style={{ backgroundColor: mod.color }}
                  />
                  {mod.name}
                </Badge>
              ) : null
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onMoveUp(step.id)}
            disabled={index === 0}
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onMoveDown(step.id)}
            disabled={index === total - 1}
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(step.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

/** Horizontal pipeline view for the saved workflow */
function PipelineView({ workflow, onEdit }: { workflow: WorkflowType; onEdit: () => void }) {
  const sortedSteps = useMemo(
    () => [...workflow.steps].sort((a, b) => a.order - b.order),
    [workflow.steps]
  );

  // Collect all unique modules across steps, grouped by step
  const modulesByStep = useMemo(() => {
    return sortedSteps.map((step) => ({
      step,
      modules: step.moduleLinks.map(resolveModuleLink).filter(Boolean),
    }));
  }, [sortedSteps]);

  // Unique flat module list
  const allUniqueModules = useMemo(() => {
    const seen = new Set<string>();
    const result: Array<NonNullable<ReturnType<typeof resolveModuleLink>> & { stepLabel: string }> =
      [];
    for (const { step, modules } of modulesByStep) {
      for (const mod of modules) {
        if (!mod) continue;
        const key = `${mod.category}/${mod.slug}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push({ ...mod, stepLabel: step.label });
        }
      }
    }
    return result;
  }, [modulesByStep]);

  return (
    <div className="space-y-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] as const }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
            <Workflow className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{workflow.name}</h1>
            <p className="text-sm text-muted-foreground">
              {sortedSteps.length} step{sortedSteps.length !== 1 ? 's' : ''} &middot;{' '}
              {allUniqueModules.length} module{allUniqueModules.length !== 1 ? 's' : ''} linked
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onEdit}>
          <Edit2 className="h-3.5 w-3.5" />
          Edit Workflow
        </Button>
      </motion.div>

      {/* Horizontal pipeline */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 0.61, 0.36, 1] as const }}
      >
        <ScrollArea className="w-full">
          <div className="flex items-stretch gap-0 pb-4 min-w-max">
            {sortedSteps.map((step, i) => {
              const mods = step.moduleLinks.map(resolveModuleLink).filter(Boolean);
              return (
                <div key={step.id} className="flex items-stretch">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: i * 0.07,
                      duration: 0.35,
                      ease: [0.22, 0.61, 0.36, 1] as const,
                    }}
                    className="surface hairline rounded-2xl p-5 w-56 flex flex-col"
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary font-bold text-xs font-mono">
                        {i + 1}
                      </span>
                      <h3 className="text-sm font-semibold truncate">{step.label}</h3>
                    </div>
                    {step.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mb-3">
                        {step.description}
                      </p>
                    )}
                    <div className="mt-auto">
                      <span className="text-[11px] text-muted-foreground/60 font-mono">
                        {mods.length} module{mods.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </motion.div>
                  {i < sortedSteps.length - 1 && (
                    <div className="flex items-center px-2">
                      <ArrowRight className="h-4 w-4 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </motion.div>

      {/* Module list by step */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4, ease: [0.22, 0.61, 0.36, 1] as const }}
        className="space-y-6"
      >
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            My Module List
          </h2>
          <p className="text-xs text-muted-foreground/60">
            All unique modules linked across your workflow, grouped by step.
          </p>
        </div>

        <Separator />

        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
          {modulesByStep.map(({ step, modules }) => {
            if (modules.length === 0) return null;
            return (
              <motion.div key={step.id} variants={fadeUp}>
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-primary text-[10px] font-bold font-mono">
                    {step.order + 1}
                  </span>
                  {step.label}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {modules.map((mod) => {
                    if (!mod) return null;
                    return (
                      <Link
                        key={`${mod.category}/${mod.slug}`}
                        href={`/${mod.category}/${mod.slug}`}
                        className="group surface hairline rounded-xl p-3 flex items-center gap-3"
                      >
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
                          style={{
                            backgroundColor: `${mod.color}12`,
                            color: mod.color,
                          }}
                        >
                          <Link2 className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {mod.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {mod.categoryName}
                          </p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/20 ml-auto shrink-0 group-hover:text-primary transition-colors" />
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------
export default function WorkflowPage() {
  const workflows = useLiveQuery(() => db.workflows.toArray());
  const existingWorkflow = workflows && workflows.length > 0 ? workflows[0] : null;

  const [editing, setEditing] = useState(false);
  const [workflowName, setWorkflowName] = useState('My PM Workflow');
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const startEditing = useCallback(
    (fromScratch: boolean) => {
      if (fromScratch) {
        setWorkflowName('My PM Workflow');
        setSteps([
          {
            id: nanoid(),
            label: 'Discovery',
            description: 'Understand the problem space and user needs',
            moduleLinks: [],
            order: 0,
          },
          {
            id: nanoid(),
            label: 'Strategy',
            description: 'Define the approach and set objectives',
            moduleLinks: [],
            order: 1,
          },
          {
            id: nanoid(),
            label: 'Spec Writing',
            description: 'Write PRDs and detailed specifications',
            moduleLinks: [],
            order: 2,
          },
        ]);
      } else if (existingWorkflow) {
        setWorkflowName(existingWorkflow.name);
        setSteps([...existingWorkflow.steps].sort((a, b) => a.order - b.order));
      }
      setEditing(true);
    },
    [existingWorkflow]
  );

  const addStep = useCallback(() => {
    setSteps((prev) => [
      ...prev,
      {
        id: nanoid(),
        label: '',
        description: '',
        moduleLinks: [],
        order: prev.length,
      },
    ]);
  }, []);

  const updateStep = useCallback((id: string, patch: Partial<WorkflowStep>) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const deleteStep = useCallback((id: string) => {
    setSteps((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      return filtered.map((s, i) => ({ ...s, order: i }));
    });
  }, []);

  const moveStep = useCallback((id: string, direction: 'up' | 'down') => {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const target = direction === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next.map((s, i) => ({ ...s, order: i }));
    });
  }, []);

  const toggleModule = useCallback((stepId: string, path: string) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id !== stepId) return s;
        const has = s.moduleLinks.includes(path);
        return {
          ...s,
          moduleLinks: has ? s.moduleLinks.filter((p) => p !== path) : [...s.moduleLinks, path],
        };
      })
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (!workflowName.trim()) {
      toast.error('Give your workflow a name');
      return;
    }
    if (steps.length === 0) {
      toast.error('Add at least one step');
      return;
    }
    const emptySteps = steps.filter((s) => !s.label.trim());
    if (emptySteps.length > 0) {
      toast.error('All steps need a name');
      return;
    }

    const now = new Date().toISOString();
    const wf: WorkflowType = {
      id: existingWorkflow?.id ?? nanoid(),
      name: workflowName.trim(),
      steps: steps.map((s, i) => ({ ...s, order: i })),
      createdAt: existingWorkflow?.createdAt ?? now,
      updatedAt: now,
    };

    await db.workflows.put(wf);
    toast.success('Workflow saved');
    setEditing(false);
  }, [workflowName, steps, existingWorkflow]);

  // Loading state
  if (workflows === undefined) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-muted-foreground"
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  // Welcome screen — no workflow yet
  if (!existingWorkflow && !editing) {
    return (
      <div className="max-w-4xl mx-auto glow-bg">
        <WelcomeScreen onCreate={() => startEditing(true)} />
      </div>
    );
  }

  // View mode — workflow exists and not editing
  if (existingWorkflow && !editing) {
    return (
      <div className="max-w-5xl mx-auto glow-bg">
        <PipelineView workflow={existingWorkflow} onEdit={() => startEditing(false)} />
      </div>
    );
  }

  // Edit / Create mode
  return (
    <div className="max-w-3xl mx-auto glow-bg">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] as const }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
            <Workflow className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {existingWorkflow ? 'Edit Workflow' : 'Create Workflow'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Define your PM process steps and link relevant modules
            </p>
          </div>
        </div>

        <div className="mt-4">
          <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">
            Workflow Name
          </label>
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            placeholder="My PM Workflow"
            className="max-w-sm"
          />
        </div>
      </motion.div>

      <Separator className="mb-6" />

      <div className="space-y-4 mb-6">
        <AnimatePresence mode="popLayout">
          {steps.map((step, i) => (
            <StepCard
              key={step.id}
              step={step}
              index={i}
              total={steps.length}
              onUpdate={updateStep}
              onDelete={deleteStep}
              onMoveUp={(id) => moveStep(id, 'up')}
              onMoveDown={(id) => moveStep(id, 'down')}
              onToggleModule={toggleModule}
            />
          ))}
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex items-center gap-3"
      >
        <Button variant="outline" onClick={addStep} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Step
        </Button>
        <Button onClick={handleSave} className="gap-1.5">
          <Save className="h-4 w-4" />
          Save Workflow
        </Button>
        {existingWorkflow && (
          <Button
            variant="ghost"
            onClick={() => {
              setEditing(false);
            }}
          >
            Cancel
          </Button>
        )}
      </motion.div>
    </div>
  );
}
