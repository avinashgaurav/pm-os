// Track per-module visits + palette selections. Powers the Recent + Frequent
// sections in the ⌘K palette and the "Pick up where you left off" row on
// home. Keep this side-effect-free for SSR — every write happens inside an
// async function called from a client component.

import { db } from './db';

export interface VisitSource {
  // 'route' when a user navigates directly (URL bar, sidebar, link), 'palette'
  // when the ⌘K palette selected the module. Both are counted toward
  // `visits`; palette selections also bump `paletteSelections` for future
  // analytics on which surfaces drive usage.
  source: 'route' | 'palette';
}

const SLUG_RE = /^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/;

// Atomically bump the counter for a module slug. Idempotent on the same call
// site — safe to invoke from a useEffect on every render of a module page.
// Rejects malformed slugs to keep the table well-formed.
export async function recordVisit(slug: string, { source }: VisitSource): Promise<void> {
  if (!SLUG_RE.test(slug)) return;
  const now = new Date().toISOString();
  await db.transaction('rw', db.moduleVisits, async () => {
    const existing = await db.moduleVisits.get(slug);
    if (existing) {
      await db.moduleVisits.update(slug, {
        visits: existing.visits + 1,
        paletteSelections: existing.paletteSelections + (source === 'palette' ? 1 : 0),
        lastVisitedAt: now,
      });
    } else {
      await db.moduleVisits.add({
        slug,
        visits: 1,
        paletteSelections: source === 'palette' ? 1 : 0,
        lastVisitedAt: now,
      });
    }
  });
}
