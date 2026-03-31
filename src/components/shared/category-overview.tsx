'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from './page-header';
import type { CategoryConfig } from '@/types';

interface CategoryOverviewProps {
  category: CategoryConfig;
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.03 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const } },
};

export function CategoryOverview({ category }: CategoryOverviewProps) {
  return (
    <div>
      <PageHeader title={category.name} description={category.description} />
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {category.modules.map((mod) => (
          <motion.div key={mod.slug} variants={fadeUp}>
            <Link
              href={`/${category.slug}/${mod.slug}`}
              className="group flex flex-col justify-between rounded-xl border border-border p-5 hover:bg-accent/30 hover:border-primary/20 transition-all min-h-[140px]"
            >
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">
                    {mod.name}
                  </h3>
                  {mod.isNew && (
                    <Badge className="h-4 px-1 text-[9px] font-medium bg-primary/15 text-primary border-0">
                      NEW
                    </Badge>
                  )}
                </div>
                <p className="text-[12px] text-muted-foreground line-clamp-2">
                  {mod.description}
                </p>
              </div>
              <div className="flex items-center justify-between mt-3">
                <Badge variant="secondary" className="text-[10px] font-normal capitalize">
                  {mod.archetype}
                </Badge>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
