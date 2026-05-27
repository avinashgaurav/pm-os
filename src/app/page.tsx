'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { categories, getModule } from '@/lib/constants';
import { useDocumentCount, useRecentDocuments } from '@/hooks/use-documents';
import { useIsFirstVisit } from '@/hooks/use-cold-start';
import { recommendModules } from '@/lib/cold-start';
import { ColdStartWizard } from '@/components/onboarding/cold-start-wizard';
import { formatDistanceToNow } from 'date-fns';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 0.61, 0.36, 1] as const } },
};

const categoryAbbr: Record<string, string> = {
  discovery: 'DI',
  strategy: 'ST',
  specs: 'SP',
  planning: 'PL',
  analytics: 'AN',
  competitive: 'CP',
  communication: 'CM',
  launch: 'LA',
  operations: 'OP',
  growth: 'GR',
};

export default function Dashboard() {
  const totalDocs = useDocumentCount();
  const recentDocs = useRecentDocuments(6);
  const totalModules = categories.reduce((sum, c) => sum + c.modules.length, 0);
  const hasDocuments = (totalDocs ?? 0) > 0;

  // Single Dexie subscription returns both the first-visit flag and the saved
  // preference — avoids a second live query that would re-render on writes.
  const { isFirst, pref: coldStart } = useIsFirstVisit();
  const [wizardOpen, setWizardOpen] = useState(false);
  useEffect(() => {
    if (isFirst === true) setWizardOpen(true);
  }, [isFirst]);

  const recommended = coldStart
    ? recommendModules(coldStart)
        .map((r) => ({ ...r, mod: getModule(r.category, r.moduleSlug) }))
        .filter((r) => r.mod !== undefined)
    : [];

  return (
    <div className="max-w-6xl mx-auto">
      {/* xAI bold-display hero */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] as const }}
        className="mb-12 pt-2"
      >
        <h1 className="bold-display-xl mb-4">
          Product Management
          <br />
          Operating System.
        </h1>
        <p className="text-base text-muted-foreground max-w-xl">
          {totalModules} ready-to-use PM templates across {categories.length} disciplines. From
          discovery to launch — everything you need to ship better products.
        </p>
      </motion.div>

      {/* Stats or Get Started */}
      {hasDocuments ? (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-3 gap-3 mb-10"
        >
          {[
            { label: 'Documents', value: totalDocs ?? 0 },
            { label: 'Tools', value: totalModules },
            { label: 'Disciplines', value: categories.length },
          ].map((s) => (
            <motion.div key={s.label} variants={fadeUp} className="surface hairline rounded-lg p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                {s.label}
              </p>
              <p className="text-2xl font-semibold tracking-tight">{s.value}</p>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <div className="surface hairline rounded-xl p-8 text-center">
            <Sparkles className="h-7 w-7 text-foreground mx-auto mb-3" />
            <h2 className="text-lg font-semibold mb-2">Get started in seconds</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">
              Pick any tool below, fill in the structured form, and generate a professionally
              formatted PM deliverable.
            </p>
            <Link
              href="/specs/prd"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Try PRD Generator <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </motion.div>
      )}

      {/* Workflow CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-10"
      >
        <Link
          href="/workflow"
          className="group surface hairline rounded-lg p-4 flex items-center justify-between hover:bg-accent transition-colors"
        >
          <div>
            <h3 className="text-sm font-semibold mb-0.5">My Workflow</h3>
            <p className="text-xs text-muted-foreground">
              Map your process and get a personalized toolkit.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </Link>
      </motion.div>

      {/* Recent */}
      {recentDocs && recentDocs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
        >
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Recent Work
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentDocs.map((doc) => (
              <Link
                key={doc.id}
                href={`/${doc.category}/${doc.moduleSlug}`}
                className="surface hairline rounded-lg p-4 block hover:bg-accent transition-colors"
              >
                <h4 className="text-sm font-medium truncate">{doc.title || 'Untitled'}</h4>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                </p>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recommended (cold-start) */}
      {recommended.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="mb-10"
        >
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Recommended for you
          </h2>
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {recommended.map((r) => (
              <motion.div key={`${r.category}/${r.moduleSlug}`} variants={fadeUp}>
                <Link
                  href={`/${r.category}/${r.moduleSlug}`}
                  className="group surface hairline rounded-lg p-4 block hover:bg-accent transition-colors"
                  title={r.reason}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-sm font-semibold">{r.mod?.name}</h3>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-foreground transition-colors" />
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2">
                    {r.mod?.description}
                  </p>
                  <span className="text-[10px] text-muted-foreground/60">{r.reason}</span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}

      {/* Disciplines */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Disciplines
        </h2>
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {categories.map((cat) => (
            <motion.div key={cat.slug} variants={fadeUp}>
              <Link
                href={`/${cat.slug}`}
                className="group surface hairline rounded-lg p-4 block hover:bg-accent transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-md text-xs font-bold"
                    style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                  >
                    {categoryAbbr[cat.slug] || cat.name.slice(0, 2).toUpperCase()}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-foreground transition-colors" />
                </div>
                <h3 className="text-sm font-semibold mb-1">{cat.name}</h3>
                <p className="text-[12px] text-muted-foreground line-clamp-2 mb-2">
                  {cat.description}
                </p>
                <span className="text-[10px] text-muted-foreground/50">
                  {cat.modules.length} tools
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      <ColdStartWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </div>
  );
}
