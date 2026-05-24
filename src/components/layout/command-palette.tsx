'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/stores/ui-store';
import { categories } from '@/lib/constants';
import { db } from '@/lib/db';
import { downloadJSON } from '@/lib/export';
import {
  Search,
  X,
  ArrowRight,
  Settings as SettingsIcon,
  Workflow,
  LayoutGrid,
  Sun,
  Moon,
  Download,
} from 'lucide-react';
import { Kbd } from '@/components/ui/kbd';

type Action = {
  id: string;
  kind: 'nav' | 'action';
  group: string;
  label: string;
  description?: string;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  accent?: string;
  onSelect: () => void;
};

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setCommandPaletteOpen(false), [setCommandPaletteOpen]);

  // ⌘K toggle + Esc close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if (e.key === 'Escape' && commandPaletteOpen) {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [setCommandPaletteOpen, commandPaletteOpen, close]);

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setSelected(0);
    }
  }, [commandPaletteOpen]);

  const exportAll = useCallback(async () => {
    const data = {
      documents: await db.documents.toArray(),
      decisions: await db.decisions.toArray(),
      assumptions: await db.assumptions.toArray(),
      risks: await db.risks.toArray(),
      okrs: await db.okrs.toArray(),
      releases: await db.releases.toArray(),
      stakeholders: await db.stakeholders.toArray(),
      changelogEntries: await db.changelogEntries.toArray(),
      competencyScores: await db.competencyScores.toArray(),
      hypotheses: await db.hypotheses.toArray(),
      exportedAt: new Date().toISOString(),
    };
    downloadJSON(data, 'pm-os-backup-' + new Date().toISOString().slice(0, 10));
  }, []);

  const toggleTheme = useCallback(() => {
    const root = document.documentElement;
    const isDark = root.classList.contains('dark');
    root.classList.toggle('dark', !isDark);
    localStorage.setItem('pm-os-theme', !isDark ? 'dark' : 'light');
  }, []);

  // Build the full action list. Recomputed only when categories change (constant).
  const allActions = useMemo<Action[]>(() => {
    const acts: Action[] = [
      {
        id: 'nav-dashboard',
        kind: 'nav',
        group: 'Quick actions',
        label: 'Dashboard',
        hint: 'Home',
        icon: LayoutGrid,
        onSelect: () => router.push('/'),
      },
      {
        id: 'nav-workflow',
        kind: 'nav',
        group: 'Quick actions',
        label: 'My Workflow',
        icon: Workflow,
        onSelect: () => router.push('/workflow'),
      },
      {
        id: 'nav-settings',
        kind: 'nav',
        group: 'Quick actions',
        label: 'Settings',
        icon: SettingsIcon,
        onSelect: () => router.push('/settings'),
      },
      {
        id: 'action-toggle-theme',
        kind: 'action',
        group: 'Quick actions',
        label: 'Toggle theme',
        description: 'Switch between dark and light',
        icon:
          typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
            ? Sun
            : Moon,
        onSelect: toggleTheme,
      },
      {
        id: 'action-export-all',
        kind: 'action',
        group: 'Quick actions',
        label: 'Export all data (JSON)',
        description: 'Download a full IndexedDB snapshot',
        icon: Download,
        onSelect: exportAll,
      },
    ];

    for (const cat of categories) {
      for (const mod of cat.modules) {
        acts.push({
          id: `mod-${cat.slug}-${mod.slug}`,
          kind: 'nav',
          group: cat.name,
          label: mod.name,
          description: mod.description,
          hint: mod.archetype,
          accent: cat.color,
          onSelect: () => router.push(`/${cat.slug}/${mod.slug}`),
        });
      }
    }
    return acts;
  }, [router, exportAll, toggleTheme]);

  // Filter + group.
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return allActions;
    return allActions.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q) ||
        a.group.toLowerCase().includes(q)
    );
  }, [allActions, query]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Action[]>();
    for (const a of filtered) {
      const arr = groups.get(a.group) ?? [];
      arr.push(a);
      groups.set(a.group, arr);
    }
    return Array.from(groups.entries());
  }, [filtered]);

  // Flat indexed list for ↑↓ Enter navigation.
  const flat = filtered;

  useEffect(() => {
    setSelected(0);
  }, [query]);

  useEffect(() => {
    if (!commandPaletteOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected((s) => Math.min(s + 1, flat.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected((s) => Math.max(s - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = flat[selected];
        if (item) {
          item.onSelect();
          if (item.kind === 'nav') close();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [commandPaletteOpen, flat, selected, close]);

  // Scroll selected into view.
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${selected}"]`);
    if (el && 'scrollIntoView' in el) {
      (el as HTMLElement).scrollIntoView({ block: 'nearest' });
    }
  }, [selected]);

  if (!commandPaletteOpen) return null;

  let runningIdx = 0;

  return (
    <div className="fixed inset-0 z-50" onClick={close}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="fixed top-[14%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50 px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-xl border border-border bg-popover shadow-2xl overflow-hidden">
          <div className="flex items-center border-b border-border px-4">
            <Search className="h-4 w-4 text-muted-foreground mr-3 shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 h-12 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Search modules, actions, settings…"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 rounded hover:bg-accent mr-2"
                aria-label="Clear"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
            <Kbd className="hidden sm:inline-flex" size="sm">
              esc
            </Kbd>
          </div>
          <div ref={listRef} className="max-h-[400px] overflow-y-auto p-2">
            {flat.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  No matches for &ldquo;{query}&rdquo;
                </p>
                <p className="text-[11px] text-muted-foreground/60 mt-1">
                  Try a different keyword or browse via the sidebar
                </p>
              </div>
            ) : (
              grouped.map(([group, items]) => (
                <div key={group} className="mb-1">
                  <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    {group}
                  </div>
                  {items.map((item) => {
                    const idx = runningIdx++;
                    const isSelected = idx === selected;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        data-idx={idx}
                        onMouseEnter={() => setSelected(idx)}
                        onClick={() => {
                          item.onSelect();
                          if (item.kind === 'nav') close();
                        }}
                        className={`group/row flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors ${
                          isSelected ? 'bg-accent' : ''
                        }`}
                      >
                        {Icon ? (
                          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        ) : item.accent ? (
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: item.accent }}
                          />
                        ) : (
                          <span className="h-2 w-2 rounded-full shrink-0 bg-muted-foreground/40" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-foreground truncate">{item.label}</div>
                          {item.description && (
                            <div className="text-[11px] text-muted-foreground truncate">
                              {item.description}
                            </div>
                          )}
                        </div>
                        {item.hint && (
                          <span className="text-[10px] text-muted-foreground/60 capitalize">
                            {item.hint}
                          </span>
                        )}
                        {isSelected && (
                          <Kbd size="sm" className="ml-2">
                            ↵
                          </Kbd>
                        )}
                        {!isSelected && (
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/0 group-hover/row:text-muted-foreground/40 transition-colors" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
          <div className="border-t border-border px-3 py-2 flex items-center justify-between text-[10px] text-muted-foreground/70">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <Kbd size="sm">↑</Kbd>
                <Kbd size="sm">↓</Kbd>
                navigate
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd size="sm">↵</Kbd>
                select
              </span>
            </div>
            <span className="flex items-center gap-1.5">
              <Kbd size="sm">?</Kbd>
              for all shortcuts
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
