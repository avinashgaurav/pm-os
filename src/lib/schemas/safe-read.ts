import * as Sentry from '@sentry/nextjs';
import type { z } from 'zod';

// Validate a single row read from Dexie. If it doesn't match the schema we log
// a warning and return null — callers filter out nulls so the UI never sees a
// corrupted row. No Sentry capture here; use `safeRows` for batched reads so
// per-table events get aggregated and don't flood the Sentry quota.
export function safeRow<T>(schema: z.ZodType<T>, row: unknown, tableName: string): T | null {
  const result = schema.safeParse(row);
  if (result.success) return result.data;
  const id = typeof row === 'object' && row !== null ? (row as { id?: unknown }).id : undefined;
  const issues = result.error.issues
    .slice(0, 3)
    .map((i) => `${i.path.join('.')}: ${i.message}`)
    .join('; ');
  console.warn(`[schemas] Dropped invalid row from ${tableName} (id=${String(id)}): ${issues}`);
  return null;
}

// Validate an array of Dexie rows. Drops invalid rows; preserves order of valid
// rows so list rendering stays stable. Aggregates Sentry into a single event
// per call with a sampled summary, so a profile with N corrupt rows produces
// 1 event per page-load instead of N events.
export function safeRows<T>(schema: z.ZodType<T>, rows: unknown[], tableName: string): T[] {
  const out: T[] = [];
  const dropped: { id: unknown; issues: string }[] = [];
  for (const row of rows) {
    const result = schema.safeParse(row);
    if (result.success) {
      out.push(result.data);
      continue;
    }
    const id = typeof row === 'object' && row !== null ? (row as { id?: unknown }).id : undefined;
    const issues = result.error.issues
      .slice(0, 2)
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    console.warn(`[schemas] Dropped invalid row from ${tableName} (id=${String(id)}): ${issues}`);
    dropped.push({ id, issues });
  }
  if (dropped.length > 0) {
    Sentry.captureMessage(`Dropped ${dropped.length} invalid row(s) from ${tableName}`, {
      level: 'warning',
      tags: { area: 'schemas', table: tableName },
      extra: { sample: dropped.slice(0, 5), total: dropped.length },
    });
  }
  return out;
}
