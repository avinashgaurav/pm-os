'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { getModule } from '@/lib/constants';
import type { ModuleConfig } from '@/types';

export interface VisitedModule {
  category: string;
  moduleSlug: string;
  visits: number;
  lastVisitedAt: string;
  mod: ModuleConfig;
}

function decorate(
  rows: { slug: string; visits: number; lastVisitedAt: string }[]
): VisitedModule[] {
  const out: VisitedModule[] = [];
  for (const row of rows) {
    const [category, moduleSlug] = row.slug.split('/');
    if (!category || !moduleSlug) continue;
    const mod = getModule(category, moduleSlug);
    if (!mod) continue; // Module removed from constants — skip.
    out.push({ category, moduleSlug, visits: row.visits, lastVisitedAt: row.lastVisitedAt, mod });
  }
  return out;
}

// Top N modules sorted by lastVisitedAt desc. Hook value is `undefined` while
// Dexie is still loading so consumers can render a skeleton if they want.
export function useRecentModules(limit = 5): VisitedModule[] | undefined {
  return useLiveQuery(async () => {
    const rows = await db.moduleVisits.orderBy('lastVisitedAt').reverse().limit(limit).toArray();
    return decorate(rows);
  }, [limit]);
}

// Top N modules sorted by visits desc. Same loading semantics as recents.
export function useFrequentModules(limit = 5): VisitedModule[] | undefined {
  return useLiveQuery(async () => {
    const rows = await db.moduleVisits.orderBy('visits').reverse().limit(limit).toArray();
    return decorate(rows);
  }, [limit]);
}

// Note: there is intentionally no per-page visit hook. RouteVisitTracker
// (mounted once in ClientProviders) records every /<category>/<moduleSlug>
// navigation, so a page-level tracker would double-count.
