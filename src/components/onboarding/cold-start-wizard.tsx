'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, ArrowLeft, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  ROLE_LABELS,
  FOCUS_LABELS,
  MATURITY_LABELS,
  type Role,
  type Focus,
  type Maturity,
  type ColdStartPreference,
} from '@/lib/cold-start';
import { saveColdStartPreference } from '@/hooks/use-cold-start';

// Three-step overlay shown on first visit. The user picks role, focus, and
// data maturity; we save the answer to Dexie and the home page renders a
// "Recommended for you" section above the full category grid. Skippable at
// any step — skip writes a sentinel preference so we don't re-prompt.

interface ColdStartWizardProps {
  open: boolean;
  onClose: () => void;
}

export function ColdStartWizard({ open, onClose }: ColdStartWizardProps) {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role | null>(null);
  const [focus, setFocus] = useState<Focus | null>(null);
  const [maturity, setMaturity] = useState<Maturity | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canAdvance =
    (step === 0 && role !== null) ||
    (step === 1 && focus !== null) ||
    (step === 2 && maturity !== null);

  const handleNext = async () => {
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    if (!role || !focus || !maturity) return;
    setSubmitting(true);
    const pref: ColdStartPreference = {
      role,
      focus,
      maturity,
      version: 1,
      completedAt: new Date().toISOString(),
    };
    try {
      await saveColdStartPreference(pref);
    } finally {
      setSubmitting(false);
      onClose();
    }
  };

  const handleSkip = async () => {
    // Save a sentinel so we don't re-prompt. We persist the answers the user
    // did give (if any) so the recommendations engine has whatever signal we
    // captured; if they skipped step 1, fall back to a neutral default of
    // "IC PM / strategy / some-docs" rather than blanks.
    const pref: ColdStartPreference = {
      role: role ?? 'ic-pm',
      focus: focus ?? 'strategy',
      maturity: maturity ?? 'some-docs',
      version: 1,
      completedAt: new Date().toISOString(),
    };
    setSubmitting(true);
    try {
      await saveColdStartPreference(pref);
    } finally {
      setSubmitting(false);
      onClose();
    }
  };

  const steps = [
    {
      title: 'What’s your role?',
      hint: 'Helps us suggest the right depth.',
      options: Object.entries(ROLE_LABELS) as [Role, string][],
      value: role,
      setValue: (v: string) => setRole(v as Role),
    },
    {
      title: 'What’s your current focus?',
      hint: 'We’ll lead with modules for that workstream.',
      options: Object.entries(FOCUS_LABELS) as [Focus, string][],
      value: focus,
      setValue: (v: string) => setFocus(v as Focus),
    },
    {
      title: 'What do you have today?',
      hint: 'Tunes whether to start with discovery or build on what exists.',
      options: Object.entries(MATURITY_LABELS) as [Maturity, string][],
      value: maturity,
      setValue: (v: string) => setMaturity(v as Maturity),
    },
  ];

  const cur = steps[step];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleSkip()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-foreground/70" />
            <span className="ai-gradient-text text-xs font-semibold uppercase tracking-widest">
              Welcome to PM OS
            </span>
          </div>
          <button
            onClick={handleSkip}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            disabled={submitting}
          >
            Show me everything <X className="h-3 w-3" />
          </button>
        </div>

        <div className="px-5 pb-5">
          <div className="flex items-center gap-1.5 mb-5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? 'bg-foreground' : 'bg-border'
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25, ease: [0.22, 0.61, 0.36, 1] as const }}
            >
              <h2 className="text-lg font-semibold mb-1">{cur.title}</h2>
              <p className="text-xs text-muted-foreground mb-4">{cur.hint}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {cur.options.map(([key, label]) => {
                  const selected = cur.value === key;
                  return (
                    <button
                      key={key}
                      onClick={() => cur.setValue(key)}
                      disabled={submitting}
                      className={`text-left rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                        selected
                          ? 'border-foreground bg-accent text-foreground'
                          : 'border-border hover:bg-accent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0 || submitting}
              className="gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>
            <span className="text-[10px] text-muted-foreground font-mono tabular-nums">
              {step + 1} / 3
            </span>
            <Button
              size="sm"
              onClick={handleNext}
              disabled={!canAdvance || submitting}
              className="gap-1.5"
            >
              {step === 2 ? 'Done' : 'Next'} <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
