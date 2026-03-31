'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  FileText, Search, Compass, Calendar, BarChart3, Swords,
  MessageCircle, Rocket, Settings, Sprout, ArrowRight, Hexagon,
} from 'lucide-react';
import { categories } from '@/lib/constants';
import { useDocumentCount, useRecentDocuments } from '@/hooks/use-documents';
import { StatCard } from '@/components/shared/stat-card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Search, Compass, FileText, Calendar, BarChart3, Swords,
  MessageCircle, Rocket, Settings, Sprout,
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function Dashboard() {
  const totalDocs = useDocumentCount();
  const recentDocs = useRecentDocuments(8);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const totalModules = categories.reduce((sum, c) => sum + c.modules.length, 0);

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Hexagon className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{greeting()}</h1>
            <p className="text-sm text-muted-foreground">
              Your Product Management Operating System
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10"
      >
        <motion.div variants={fadeUp}>
          <StatCard label="Total Documents" value={totalDocs ?? 0} icon={<FileText className="h-4 w-4" />} color="#6366f1" />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard label="Modules Available" value={totalModules} icon={<Compass className="h-4 w-4" />} color="#a855f7" />
        </motion.div>
        <motion.div variants={fadeUp}>
        </motion.div>
      </motion.div>

      {recentDocs && recentDocs.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.35 }} className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Recent Documents</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentDocs.map((doc) => (
              <Link key={doc.id} href={`/${doc.category}/${doc.moduleSlug}`} className="group rounded-lg border border-border p-3.5 hover:bg-accent/50 transition-colors">
                <h4 className="text-sm font-medium truncate group-hover:text-primary transition-colors">{doc.title || 'Untitled'}</h4>
                <p className="text-[11px] text-muted-foreground mt-1">{formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}</p>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.35 }}>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Categories</h2>
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const Icon = iconMap[cat.icon] || Search;
            return (
              <motion.div key={cat.slug} variants={fadeUp}>
                <Link href={`/${cat.slug}`} className="group glass-card rounded-xl p-5 block hover:scale-[1.01] transition-transform">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                  </div>
                  <h3 className="text-sm font-semibold mb-0.5">{cat.name}</h3>
                  <p className="text-[12px] text-muted-foreground line-clamp-2 mb-2.5">{cat.description}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground/60">{cat.modules.length} modules</span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </div>
  );
}
