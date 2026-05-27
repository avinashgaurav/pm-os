'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { recordVisit } from '@/lib/module-visits';
import { getModule } from '@/lib/constants';

// Mounted once at the layout level. Watches the pathname; whenever the URL
// matches /<category>/<moduleSlug> AND that module exists in constants, bump
// the visit counter. Per-pathname dedup ref keeps fast-refresh re-runs and
// React StrictMode double-renders from inflating the counter.
//
// Tracking lives here (not in each module page) so adding a new module
// automatically gets recents/frequents without a per-page wiring change.

export function RouteVisitTracker() {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length !== 2) return; // skip root, settings, /workflow, etc.
    const [category, moduleSlug] = parts;
    if (!getModule(category, moduleSlug)) return;
    const slug = `${category}/${moduleSlug}`;
    if (lastTracked.current === slug) return;
    lastTracked.current = slug;
    void recordVisit(slug, { source: 'route' });
  }, [pathname]);

  return null;
}
