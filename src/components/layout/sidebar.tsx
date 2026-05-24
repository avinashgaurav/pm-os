'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Settings,
  LayoutGrid,
  Workflow,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { categories } from '@/lib/constants';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUIStore } from '@/stores/ui-store';

const categoryAbbr: Record<string, string> = {
  discovery: 'DI',
  strategy: 'ST',
  specs: 'SP',
  planning: 'PL',
  analytics: 'AN',
  competitive: 'CP',
  communication: 'CM',
  launch: 'LA',
  operations: 'OP',
  growth: 'GR',
};

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();
  const [expandedCategories, setExpandedCategories] = useState<string[]>(() => {
    const active = categories.find((c) => pathname.startsWith('/' + c.slug));
    return active ? [active.slug] : [];
  });
  const toggleCategory = (slug: string) => {
    setExpandedCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 60 : 260 }}
      transition={{ duration: 0.25, ease: [0.22, 0.61, 0.36, 1] as const }}
      className="fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar border-r border-sidebar-border"
    >
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-[10px] font-extrabold tracking-tight">
            PM
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
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>
      <ScrollArea className="flex-1 px-2 py-1">
        <Link
          href="/"
          title={sidebarCollapsed ? 'Dashboard' : undefined}
          className={cn(
            'flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-all mb-0.5',
            sidebarCollapsed && 'justify-center px-0',
            pathname === '/' && 'bg-accent text-foreground font-medium'
          )}
        >
          <LayoutGrid className="h-4 w-4 shrink-0" />
          {!sidebarCollapsed && <span>Dashboard</span>}
        </Link>
        <Link
          href="/workflow"
          title={sidebarCollapsed ? 'My Workflow' : undefined}
          className={cn(
            'flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-all mb-2',
            sidebarCollapsed && 'justify-center px-0',
            pathname === '/workflow' && 'bg-accent text-foreground font-medium'
          )}
        >
          <Workflow className="h-4 w-4 shrink-0" />
          {!sidebarCollapsed && <span>My Workflow</span>}
        </Link>
        <div className="h-px bg-border mb-2" />
        <div className="space-y-0.5">
          {categories.map((category) => {
            const isExpanded = expandedCategories.includes(category.slug);
            const isActive = pathname.startsWith('/' + category.slug);
            const monogram = categoryAbbr[category.slug] || category.name.slice(0, 2).toUpperCase();
            if (sidebarCollapsed) {
              return (
                <Link
                  key={category.slug}
                  href={'/' + category.slug}
                  title={category.name}
                  className={cn(
                    'flex h-9 w-full items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors',
                    isActive && 'bg-accent text-foreground'
                  )}
                >
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: isActive ? 'var(--foreground)' : category.color }}
                  >
                    {monogram}
                  </span>
                </Link>
              );
            }
            return (
              <div key={category.slug}>
                <button
                  onClick={() => toggleCategory(category.slug)}
                  className={cn(
                    'flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors',
                    isActive && 'text-foreground'
                  )}
                >
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded text-[8px] font-bold shrink-0"
                    style={{ backgroundColor: category.color + '18', color: category.color }}
                  >
                    {monogram}
                  </span>
                  <span className="flex-1 text-left truncate">{category.name}</span>
                  <span className="text-[10px] text-muted-foreground/50">
                    {category.modules.length}
                  </span>
                  <ChevronRight
                    className={cn(
                      'h-3 w-3 shrink-0 text-muted-foreground/30 transition-transform duration-200',
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
                      transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] as const }}
                      className="overflow-hidden"
                    >
                      <div className="ml-5 border-l border-border/50 pl-3 py-0.5">
                        {category.modules.map((mod) => {
                          const modPath = '/' + category.slug + '/' + mod.slug;
                          const isModActive = pathname === modPath;
                          return (
                            <Link
                              key={mod.slug}
                              href={modPath}
                              className={cn(
                                'flex h-7 items-center rounded-md px-2 text-[12px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors',
                                isModActive && 'bg-accent text-foreground font-medium'
                              )}
                            >
                              <span className="truncate">{mod.name}</span>
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
      <div className="border-t border-sidebar-border p-2">
        {sidebarCollapsed ? (
          <button
            onClick={toggleSidebarCollapsed}
            title="Expand"
            className="flex h-9 w-full items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex items-center justify-between px-3">
            <span className="text-[10px] text-muted-foreground/50">
              {categories.reduce((s, c) => s + c.modules.length, 0)} tools
            </span>
            <Link
              href="/settings"
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Settings className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
