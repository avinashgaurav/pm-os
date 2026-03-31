'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface TimelineItem {
  id: string;
  title: string;
  date: string;
  type: string;
  color: string;
  description?: string;
}

export interface TimelineViewProps {
  items: TimelineItem[];
  onItemClick?: (item: TimelineItem) => void;
}

interface MonthGroup {
  key: string;
  label: string;
  year: number;
  month: number;
  items: TimelineItem[];
}

function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}

function formatDay(dateStr: string): string {
  const d = parseDate(dateStr);
  return d.toLocaleDateString('en-US', { day: 'numeric' });
}

function formatDayOfWeek(dateStr: string): string {
  const d = parseDate(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

function getMonthLabel(year: number, month: number): string {
  const d = new Date(year, month, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function groupByMonth(items: TimelineItem[]): MonthGroup[] {
  const sorted = [...items].sort(
    (a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime()
  );

  const groups = new Map<string, MonthGroup>();

  for (const item of sorted) {
    const d = parseDate(item.date);
    const year = d.getFullYear();
    const month = d.getMonth();
    const key = `${year}-${String(month).padStart(2, '0')}`;

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label: getMonthLabel(year, month),
        year,
        month,
        items: [],
      });
    }
    groups.get(key)!.items.push(item);
  }

  return Array.from(groups.values());
}

function ItemDetail({
  item,
  onClose,
}: {
  item: TimelineItem;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 w-64 rounded-xl bg-card ring-1 ring-foreground/10 p-4 shadow-lg"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <Badge
            variant="secondary"
            className="text-[9px] px-1.5 h-4 mb-1.5"
            style={{
              backgroundColor: `${item.color}15`,
              color: item.color,
            }}
          >
            {item.type}
          </Badge>
          <h4 className="text-sm font-semibold leading-tight">{item.title}</h4>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-0.5 rounded hover:bg-muted transition-colors shrink-0"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground mb-2">
        {parseDate(item.date).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}
      </p>
      {item.description && (
        <p className="text-xs text-muted-foreground/80 leading-relaxed">
          {item.description}
        </p>
      )}
    </motion.div>
  );
}

export function TimelineView({ items, onItemClick }: TimelineViewProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [selectedItem, setSelectedItem] = React.useState<TimelineItem | null>(null);

  const monthGroups = React.useMemo(() => groupByMonth(items), [items]);

  function scrollBy(direction: 'left' | 'right') {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.6;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  }

  function handleItemClick(item: TimelineItem) {
    if (onItemClick) {
      onItemClick(item);
    } else {
      setSelectedItem((prev) => (prev?.id === item.id ? null : item));
    }
  }

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
          <Calendar className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No timeline items yet</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
      className="relative"
    >
      {/* Scroll controls */}
      <div className="flex items-center justify-end gap-1 mb-3">
        <Button variant="ghost" size="icon-xs" onClick={() => scrollBy('left')}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon-xs" onClick={() => scrollBy('right')}>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Timeline container */}
      <div
        ref={scrollRef}
        className="overflow-x-auto pb-4 scrollbar-thin"
      >
        <div className="inline-flex min-w-full gap-0">
          {monthGroups.map((group, groupIndex) => (
            <motion.div
              key={group.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: groupIndex * 0.05,
                ease: [0.16, 1, 0.3, 1] as const,
              }}
              className={cn(
                'flex-shrink-0 px-4 min-w-[180px]',
                groupIndex > 0 && 'border-l border-border/40'
              )}
            >
              {/* Month label */}
              <div className="mb-4">
                <h3 className="text-xs font-semibold tracking-wide uppercase text-foreground/70">
                  {group.label}
                </h3>
                <div className="mt-1.5 h-px bg-gradient-to-r from-border to-transparent" />
              </div>

              {/* Items in this month */}
              <div className="relative space-y-0">
                {/* Vertical timeline line */}
                <div className="absolute left-[18px] top-2 bottom-2 w-px bg-border/50" />

                {group.items.map((item, itemIndex) => (
                  <div key={item.id} className="relative flex items-start gap-3 pb-4">
                    {/* Timeline dot */}
                    <div className="relative z-10 flex flex-col items-center pt-0.5 shrink-0">
                      <div
                        className="h-3 w-3 rounded-full ring-2 ring-card"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="mt-1 text-[9px] text-muted-foreground/60 font-medium tabular-nums whitespace-nowrap">
                        {formatDayOfWeek(item.date)}
                      </span>
                      <span className="text-[10px] font-semibold tabular-nums text-foreground/60">
                        {formatDay(item.date)}
                      </span>
                    </div>

                    {/* Item card */}
                    <div className="relative flex-1 min-w-0">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleItemClick(item)}
                        className={cn(
                          'w-full text-left rounded-lg p-2.5 ring-1 ring-foreground/10 bg-card hover:ring-foreground/20 transition-all',
                          selectedItem?.id === item.id && 'ring-2'
                        )}
                        style={{
                          borderLeftWidth: '2px',
                          borderLeftColor: item.color,
                          ...(selectedItem?.id === item.id
                            ? { ringColor: item.color }
                            : {}),
                        }}
                      >
                        <Badge
                          variant="secondary"
                          className="text-[8px] px-1 h-3.5 mb-1"
                          style={{
                            backgroundColor: `${item.color}15`,
                            color: item.color,
                          }}
                        >
                          {item.type}
                        </Badge>
                        <p className="text-xs font-semibold leading-tight truncate">
                          {item.title}
                        </p>
                        {item.description && (
                          <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-1">
                            {item.description}
                          </p>
                        )}
                      </motion.button>

                      {/* Detail popover */}
                      <AnimatePresence>
                        {selectedItem?.id === item.id && !onItemClick && (
                          <ItemDetail
                            item={item}
                            onClose={() => setSelectedItem(null)}
                          />
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent" />
    </motion.div>
  );
}
