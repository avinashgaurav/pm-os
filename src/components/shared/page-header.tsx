'use client';

import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  description: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] as const }}
      className="flex items-start justify-between mb-8"
    >
      <div>
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{description}</p>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </motion.div>
  );
}
