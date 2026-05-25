import * as React from 'react';
import { cn } from '@/lib/utils';

export type StatusVariant =
  | 'backlog'
  | 'todo'
  | 'progress'
  | 'done'
  | 'cancelled'
  | 'p0'
  | 'p1'
  | 'p2'
  | 'p3';

interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: StatusVariant;
  label?: string;
}

const labels: Record<StatusVariant, string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  progress: 'In progress',
  done: 'Done',
  cancelled: 'Cancelled',
  p0: 'P0',
  p1: 'P1',
  p2: 'P2',
  p3: 'P3',
};

// Linear-style status pill. Use for sprint cards, backlog rows, risk register,
// any kanban or board surface. The dot at the start carries the colour;
// the background tint reinforces it.
export function StatusPill({ variant, label, className, ...props }: StatusPillProps) {
  return (
    <span className={cn('status-pill', `status-pill--${variant}`, className)} {...props}>
      {label ?? labels[variant]}
    </span>
  );
}
