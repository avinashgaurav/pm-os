import * as React from 'react';
import { cn } from '@/lib/utils';

interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  size?: 'sm' | 'md';
}

// Raycast-style keycap. Renders ⌘K, ?, ↵, etc. as a small pressed key.
export function Kbd({ className, size = 'md', children, ...props }: KbdProps) {
  return (
    <kbd
      className={cn('keycap', size === 'sm' && 'h-[18px] min-w-[18px] text-[10px] px-1', className)}
      {...props}
    >
      {children}
    </kbd>
  );
}
