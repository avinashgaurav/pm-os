'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

interface PageHeaderProps {
  title: string;
  description: string;
  isNew?: boolean;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, isNew, actions }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
      className="flex items-start justify-between mb-8"
    >
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {isNew && (
            <Badge className="bg-primary/15 text-primary border-0 text-[10px] font-semibold">
              NEW
            </Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{description}</p>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </motion.div>
  );
}
