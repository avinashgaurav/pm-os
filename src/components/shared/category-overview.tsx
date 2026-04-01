'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from './page-header';
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
  return (
    <div>
      <PageHeader title={category.name} description={category.description} />
      <motion.div variants={stagger} initial="hidden" animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {category.modules.map((mod) => (
          <motion.div key={mod.slug} variants={fadeUp}>
            <Link href={`/${category.slug}/${mod.slug}`}
              className="group glass-card rounded-2xl p-5 block min-h-[140px] flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold group-hover:text-primary transition-colors mb-1">{mod.name}</h3>
                <p className="text-[12px] text-muted-foreground line-clamp-2">{mod.description}</p>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[10px] text-muted-foreground/60 capitalize" title={archetypeInfo[mod.archetype] || ''}>{mod.archetype}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-primary transition-colors" />
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
