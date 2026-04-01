'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/stores/ui-store';
import { categories } from '@/lib/constants';
import { Search, X } from 'lucide-react';

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if (e.key === 'Escape') setCommandPaletteOpen(false);
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [setCommandPaletteOpen]);

  useEffect(() => {
    if (commandPaletteOpen) setQuery('');
  }, [commandPaletteOpen]);

  const navigate = (path: string) => {
    setCommandPaletteOpen(false);
    router.push(path);
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return categories;
    return categories.map(cat => ({
      ...cat,
      modules: cat.modules.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        cat.name.toLowerCase().includes(q)
      ),
    })).filter(cat => cat.modules.length > 0);
  }, [query]);

  const quickActions = [
    { label: 'Dashboard', path: '/' },
    { label: 'My Workflow', path: '/workflow' },
    { label: 'Settings', path: '/settings' },
  ].filter(a => !query || a.label.toLowerCase().includes(query.toLowerCase()));

  const totalResults = quickActions.length + filtered.reduce((s, c) => s + c.modules.length, 0);

  if (!commandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={() => setCommandPaletteOpen(false)}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="fixed top-[18%] left-1/2 -translate-x-1/2 w-full max-w-lg z-50" onClick={e => e.stopPropagation()}>
        <div className="rounded-xl border border-border bg-popover shadow-2xl overflow-hidden">
          <div className="flex items-center border-b border-border px-4">
            <Search className="h-4 w-4 text-muted-foreground mr-3 shrink-0" />
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
              className="flex-1 h-12 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Search tools..." />
            {query && (
              <button onClick={() => setQuery('')} className="p-1 rounded hover:bg-accent mr-1">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
            <kbd className="hidden sm:inline text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">ESC</kbd>
          </div>
          <div className="max-h-[340px] overflow-y-auto p-2">
            {totalResults === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No tools found for &ldquo;{query}&rdquo;</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Try browsing categories in the sidebar</p>
              </div>
            ) : (
              <>
                {quickActions.length > 0 && (
                  <div>
                    <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Quick Actions</div>
                    {quickActions.map(item => (
                      <button key={item.path} onClick={() => navigate(item.path)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent transition-colors text-left">
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
                {filtered.map(cat => (
                  <div key={cat.slug}>
                    <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mt-2">{cat.name}</div>
                    {cat.modules.map(mod => (
                      <button key={mod.slug} onClick={() => navigate(`/${cat.slug}/${mod.slug}`)}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-accent transition-colors text-left">
                        <span>{mod.name}</span>
                        <span className="text-[10px] text-muted-foreground/50 capitalize">{mod.archetype}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
