'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import {
  COLD_START_KEY,
  ColdStartPreferenceSchema,
  type ColdStartPreference,
} from '@/lib/cold-start';
import { safeRow } from '@/lib/schemas/safe-read';
import { z } from 'zod';

// Liveness check: returns the validated ColdStartPreference if the user has
// completed the wizard, or null if they haven't.
export function useColdStartPreference(): ColdStartPreference | null | undefined {
  return useLiveQuery(async () => {
    const row = await db.preferences.get(COLD_START_KEY);
    if (!row) return null;
    // Validate-on-read: an old payload that no longer matches the schema is
    // treated as "no preference" and the wizard re-runs. Better than crashing.
    const PrefRow = z.object({
      key: z.literal(COLD_START_KEY),
      value: ColdStartPreferenceSchema,
      updatedAt: z.string(),
    });
    const valid = safeRow(PrefRow, row, 'preferences');
    return valid?.value ?? null;
  });
}

export async function saveColdStartPreference(pref: ColdStartPreference): Promise<void> {
  await db.preferences.put({
    key: COLD_START_KEY,
    value: pref,
    updatedAt: new Date().toISOString(),
  });
}

export async function clearColdStartPreference(): Promise<void> {
  await db.preferences.delete(COLD_START_KEY);
}

// Detect "first ever visit" — no documents stored AND no preference row yet.
// We use this gate so existing users (with any saved doc) never see the
// wizard, even if they happen to clear preferences for some reason.
export function useIsFirstVisit(): boolean | undefined {
  const docCount = useLiveQuery(() => db.documents.count());
  const pref = useColdStartPreference();
  if (docCount === undefined || pref === undefined) return undefined;
  return docCount === 0 && pref === null;
}
