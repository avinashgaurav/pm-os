'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { CategoryConfig } from '@/types';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 0.61, 0.36, 1] as const } },
};

const archetypeInfo: Record<string, string> = {
  document: 'Structured form — fill inputs, generate formatted output',
  canvas: 'Visual workspace — add items to quadrants or trees',
  tracker: 'Data tracker — add, filter, and manage items in lists or boards',
};

export function CategoryOverview({ category }: { category: CategoryConfig }) {
  const count = category.modules.length;
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] as const }}
        className="mb-10"
      >
        <h1 className="bold-display mb-3">{category.name}.</h1>
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <p className="text-sm text-muted-foreground max-w-2xl">{category.description}</p>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            {count} {count === 1 ? 'tool' : 'tools'}
          </span>
        </div>
      </motion.div>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      >
        {category.modules.map((mod) => (
          <motion.div key={mod.slug} variants={fadeUp}>
            <Link
              href={`/${category.slug}/${mod.slug}`}
              className="group surface hairline rounded-lg p-4 block min-h-[132px] flex flex-col justify-between hover:bg-accent transition-colors"
            >
              <div>
                <h3 className="text-sm font-semibold mb-1 group-hover:text-foreground">
                  {mod.name}
                </h3>
                <p className="text-[12px] text-muted-foreground line-clamp-2">{mod.description}</p>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span
                  className="text-[10px] text-muted-foreground/60 capitalize"
                  title={archetypeInfo[mod.archetype] || ''}
                >
                  {mod.archetype}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-foreground transition-colors" />
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
