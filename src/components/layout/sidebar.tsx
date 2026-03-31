'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Compass, FileText, Calendar, BarChart3, Swords,
  MessageCircle, Rocket, Settings, Sprout, ChevronRight,
  PanelLeftClose, PanelLeft, Hexagon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { categories } from '@/lib/constants';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useUIStore } from '@/stores/ui-store';

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Search, Compass, FileText, Calendar, BarChart3, Swords,
  MessageCircle, Rocket, Settings, Sprout,
};

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();
  const [expandedCategories, setExpandedCategories] = useState<string[]>(() => {
    const active = categories.find((c) => pathname.startsWith(`/${c.slug}`));
    return active ? [active.slug] : [];
  });

  const toggleCategory = (slug: string) => {
    setExpandedCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 64 : 280 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
      className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-sidebar"
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Hexagon className="h-4 w-4 text-primary-foreground" />
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm font-bold tracking-tight overflow-hidden whitespace-nowrap"
              >
                PM OS
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebarCollapsed}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-2">
        {/* Dashboard link */}
        {sidebarCollapsed ? (
          <Link
            href="/"
            title="Dashboard"
            className={cn(
              'flex h-9 w-full items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors mb-1',
              pathname === '/' && 'bg-accent text-foreground'
            )}
          >
            <Hexagon className="h-4 w-4" />
          </Link>
        ) : (
          <Link
            href="/"
            className={cn(
              'flex h-9 items-center gap-2.5 rounded-md px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors mb-1',
              pathname === '/' && 'bg-accent text-foreground font-medium'
            )}
          >
            <Hexagon className="h-4 w-4 shrink-0" />
            <span>Dashboard</span>
          </Link>
        )}

        {/* Category groups */}
        <div className="space-y-0.5">
          {categories.map((category) => {
            const Icon = iconMap[category.icon] || Search;
            const isExpanded = expandedCategories.includes(category.slug);
            const isActive = pathname.startsWith(`/${category.slug}`);

            if (sidebarCollapsed) {
              return (
                <Link
                  key={category.slug}
                  href={`/${category.slug}`}
                  title={`${category.name} (${category.modules.length})`}
                  className={cn(
                    'flex h-9 w-full items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors',
                    isActive && 'bg-accent text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </Link>
              );
            }

            return (
              <div key={category.slug}>
                <button
                  onClick={() => toggleCategory(category.slug)}
                  className={cn(
                    'flex h-9 w-full items-center gap-2.5 rounded-md px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors',
                    isActive && 'text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" style={{ color: category.color }} />
                  <span className="flex-1 text-left truncate">{category.name}</span>
                  <span className="text-[10px] text-muted-foreground/60">
                    {category.modules.length}
                  </span>
                  <ChevronRight
                    className={cn(
                      'h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform duration-200',
                      isExpanded && 'rotate-90'
                    )}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
                      className="overflow-hidden"
                    >
                      <div className="ml-4 border-l border-border/50 pl-2 py-0.5">
                        {category.modules.map((mod) => {
                          const modPath = `/${category.slug}/${mod.slug}`;
                          const isModActive = pathname === modPath;
                          return (
                            <Link
                              key={mod.slug}
                              href={modPath}
                              className={cn(
                                'flex h-8 items-center gap-2 rounded-md px-2.5 text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors',
                                isModActive && 'bg-primary/10 text-primary font-medium'
                              )}
                            >
                              <span className="truncate">{mod.name}</span>
                              {mod.isNew && (
                                <Badge variant="secondary" className="h-4 px-1 text-[9px] font-medium bg-primary/15 text-primary border-0">
                                  NEW
                                </Badge>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-border p-2">
        {sidebarCollapsed ? (
          <button
            onClick={toggleSidebarCollapsed}
            title="Expand sidebar"
            className="flex h-9 w-full items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex items-center justify-between px-2">
            <span className="text-[11px] text-muted-foreground/50">
              84 modules
            </span>
            <Link
              href="/settings"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Settings className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
