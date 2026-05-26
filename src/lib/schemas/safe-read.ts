import * as Sentry from '@sentry/nextjs';
import type { z } from 'zod';

// Validate a single row read from Dexie. If it doesn't match the schema we log
// a warning + Sentry breadcrumb and return null — callers filter out nulls so
// the UI never sees a corrupted row.
export function safeRow<T>(schema: z.ZodType<T>, row: unknown, tableName: string): T | null {
  const result = schema.safeParse(row);
  if (result.success) return result.data;
  const id = typeof row === 'object' && row !== null ? (row as { id?: unknown }).id : undefined;
  const issues = result.error.issues
    .slice(0, 3)
    .map((i) => `${i.path.join('.')}: ${i.message}`)
    .join('; ');
  console.warn(`[schemas] Dropped invalid row from ${tableName} (id=${String(id)}): ${issues}`);
  Sentry.captureMessage(`Invalid Dexie row dropped from ${tableName}`, {
    level: 'warning',
    tags: { area: 'schemas', table: tableName },
    extra: { id, issues },
  });
  return null;
}

// Validate an array of Dexie rows. Drops invalid rows; logs each one. Preserves
// the order of valid rows so list rendering stays stable.
export function safeRows<T>(schema: z.ZodType<T>, rows: unknown[], tableName: string): T[] {
  const out: T[] = [];
  for (const row of rows) {
    const validated = safeRow(schema, row, tableName);
    if (validated) out.push(validated);
  }
  return out;
}
