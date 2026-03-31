'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/stores/ui-store';
import { categories } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Search, X } from 'lucide-react';

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [setCommandPaletteOpen]);

  const navigate = useCallback((path: string) => {
    setCommandPaletteOpen(false);
    router.push(path);
  }, [setCommandPaletteOpen, router]);

  if (!commandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={() => setCommandPaletteOpen(false)}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-50" onClick={e => e.stopPropagation()}>
        <div className="rounded-xl border border-border bg-popover shadow-2xl overflow-hidden">
          <div className="flex items-center border-b border-border px-4">
            <Search className="h-4 w-4 text-muted-foreground mr-3" />
            <input
              autoFocus
              className="flex-1 h-12 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Search tools..."
              id="cmd-search"
              onChange={(e) => {
                const q = e.target.value.toLowerCase();
                document.querySelectorAll('[data-cmd-item]').forEach(el => {
                  const text = el.textContent?.toLowerCase() || '';
                  (el as HTMLElement).style.display = text.includes(q) ? '' : 'none';
                });
                document.querySelectorAll('[data-cmd-group]').forEach(el => {
                  const visible = el.querySelectorAll('[data-cmd-item]:not([style*="display: none"])').length;
                  (el as HTMLElement).style.display = visible > 0 ? '' : 'none';
                });
              }}
            />
            <button onClick={() => setCommandPaletteOpen(false)} className="p-1 rounded hover:bg-accent">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <div className="max-h-[320px] overflow-y-auto p-2">
            <div data-cmd-group>
              <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Quick Actions</div>
              {[
                { label: 'Dashboard', path: '/' },
                { label: 'My Workflow', path: '/workflow' },
                { label: 'Settings', path: '/settings' },
              ].map(item => (
                <button key={item.path} data-cmd-item onClick={() => navigate(item.path)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors">
                  {item.label}
                </button>
              ))}
            </div>
            {categories.map(cat => (
              <div key={cat.slug} data-cmd-group>
                <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mt-2">{cat.name}</div>
                {cat.modules.map(mod => (
                  <button key={mod.slug} data-cmd-item onClick={() => navigate(`/${cat.slug}/${mod.slug}`)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors">
                    {mod.name}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
