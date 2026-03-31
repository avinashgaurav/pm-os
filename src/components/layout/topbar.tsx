'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, ChevronRight } from 'lucide-react';
import { getCategory, getModule } from '@/lib/constants';
import { useUIStore } from '@/stores/ui-store';
import { ThemeToggle } from './theme-toggle';

export function Topbar() {
  const pathname = usePathname();
  const { setCommandPaletteOpen } = useUIStore();

  const segments = pathname.split('/').filter(Boolean);
  const categorySlug = segments[0];
  const moduleSlug = segments[1];
  const category = categorySlug ? getCategory(categorySlug) : null;
  const mod = categorySlug && moduleSlug ? getModule(categorySlug, moduleSlug) : null;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-6">
      <nav className="flex items-center gap-1.5 text-sm">
        <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
          PM OS
        </Link>
        {category && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
            <Link href={`/${category.slug}`} className="text-muted-foreground hover:text-foreground transition-colors">
              {category.name}
            </Link>
          </>
        )}
        {mod && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
            <span className="text-foreground font-medium">{mod.name}</span>
          </>
        )}
      </nav>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex h-8 items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}
