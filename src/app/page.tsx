'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { categories } from '@/lib/constants';
import { useDocumentCount, useRecentDocuments } from '@/hooks/use-documents';
import { formatDistanceToNow } from 'date-fns';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 0.61, 0.36, 1] as const } },
};

export default function Dashboard() {
  const totalDocs = useDocumentCount();
  const recentDocs = useRecentDocuments(6);
  const totalModules = categories.reduce((sum, c) => sum + c.modules.length, 0);

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] as const }} className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Product Management <span className="gradient-text">Operating System</span>
        </h1>
        <p className="text-muted-foreground max-w-lg">
          {totalModules} professional tools across {categories.length} disciplines. Build strategy, ship products, and drive outcomes.
        </p>
      </motion.div>

      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-3 gap-4 mb-12">
        {[
          { label: 'Documents Created', value: totalDocs ?? 0 },
          { label: 'Tools Available', value: totalModules },
          { label: 'Disciplines', value: categories.length },
        ].map((s) => (
          <motion.div key={s.label} variants={fadeUp} className="glass-card rounded-2xl p-6">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-1">{s.label}</p>
            <p className="text-3xl font-bold tracking-tight">{s.value}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-12">
        <Link href="/workflow" className="group glass-card rounded-2xl p-6 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold mb-1">My Workflow</h3>
            <p className="text-xs text-muted-foreground">Map your process. Get a personalized toolkit based on how you work.</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>
      </motion.div>

      {recentDocs && recentDocs.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-12">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">Recent Work</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentDocs.map((doc) => (
              <Link key={doc.id} href={`/${doc.category}/${doc.moduleSlug}`} className="glass-card rounded-xl p-4 block">
                <h4 className="text-sm font-medium truncate">{doc.title || 'Untitled'}</h4>
                <p className="text-[11px] text-muted-foreground mt-1">{formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}</p>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">Disciplines</h2>
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <motion.div key={cat.slug} variants={fadeUp}>
              <Link href={`/${cat.slug}`} className="group glass-card rounded-2xl p-6 block">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold"
                    style={{ backgroundColor: `${cat.color}18`, color: cat.color }}>
                    {cat.name.slice(0, 2).toUpperCase()}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-sm font-semibold mb-1">{cat.name}</h3>
                <p className="text-[12px] text-muted-foreground line-clamp-2 mb-3">{cat.description}</p>
                <span className="text-[11px] text-muted-foreground/60">{cat.modules.length} tools</span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
