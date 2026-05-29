// Single-source data export + import. Covers every Dexie table; import
// validates each row through its Zod schema (via safeRows) so a corrupted
// or older-shape backup drops bad rows with structured logging rather than
// crashing the editor.
//
// Wire-format envelope (v1):
//   {
//     version: 1,
//     exportedAt: "<ISO timestamp>",
//     pmOs: true,                   // sanity marker
//     tables: {
//       documents: BaseDocument[],
//       workflows: Workflow[],
//       ...
//       preferences: Preference[],
//       moduleVisits: ModuleVisit[]
//     }
//   }
//
// Adding a Dexie table is a one-line entry in TABLE_REGISTRY below.

import * as Sentry from '@sentry/nextjs';
import type { z } from 'zod';
import { db } from './db';
import {
  BaseDocumentSchema,
  WorkflowSchema,
  AssumptionSchema,
  FeedbackItemSchema,
  DecisionSchema,
  FeatureScoreSchema,
  RiskItemSchema,
  SprintSchema,
  ReleaseSchema,
  RoadmapItemSchema,
  OKRSchema,
  CompetitorSchema,
  StakeholderSchema,
  MeetingNoteSchema,
  ChangelogEntrySchema,
  CompetencyScoreSchema,
  KnowledgeItemSchema,
  HypothesisSchema,
  PreferenceSchema,
  ModuleVisitSchema,
} from './schemas';
import type Dexie from 'dexie';

interface TableRegistryEntry<T> {
  // Wire field name and the Dexie table name (kept identical to avoid drift).
  name: string;
  // Access the underlying Dexie table off the typed db instance.
  table: () => Dexie.Table<T, string>;
  // Schema used to validate each row on import.
  schema: z.ZodType<T>;
}

// Type-erased registry — entries hold their own generic instantiation. Order
// here is the order the exported JSON keys appear in, for human readability.
const TABLE_REGISTRY: TableRegistryEntry<unknown>[] = [
  {
    name: 'documents',
    table: () => db.documents as Dexie.Table<unknown, string>,
    schema: BaseDocumentSchema,
  },
  {
    name: 'workflows',
    table: () => db.workflows as Dexie.Table<unknown, string>,
    schema: WorkflowSchema,
  },
  {
    name: 'assumptions',
    table: () => db.assumptions as Dexie.Table<unknown, string>,
    schema: AssumptionSchema,
  },
  {
    name: 'feedbackItems',
    table: () => db.feedbackItems as Dexie.Table<unknown, string>,
    schema: FeedbackItemSchema,
  },
  {
    name: 'decisions',
    table: () => db.decisions as Dexie.Table<unknown, string>,
    schema: DecisionSchema,
  },
  {
    name: 'featureScores',
    table: () => db.featureScores as Dexie.Table<unknown, string>,
    schema: FeatureScoreSchema,
  },
  { name: 'risks', table: () => db.risks as Dexie.Table<unknown, string>, schema: RiskItemSchema },
  {
    name: 'sprints',
    table: () => db.sprints as Dexie.Table<unknown, string>,
    schema: SprintSchema,
  },
  {
    name: 'releases',
    table: () => db.releases as Dexie.Table<unknown, string>,
    schema: ReleaseSchema,
  },
  {
    name: 'roadmapItems',
    table: () => db.roadmapItems as Dexie.Table<unknown, string>,
    schema: RoadmapItemSchema,
  },
  { name: 'okrs', table: () => db.okrs as Dexie.Table<unknown, string>, schema: OKRSchema },
  {
    name: 'competitors',
    table: () => db.competitors as Dexie.Table<unknown, string>,
    schema: CompetitorSchema,
  },
  {
    name: 'stakeholders',
    table: () => db.stakeholders as Dexie.Table<unknown, string>,
    schema: StakeholderSchema,
  },
  {
    name: 'meetingNotes',
    table: () => db.meetingNotes as Dexie.Table<unknown, string>,
    schema: MeetingNoteSchema,
  },
  {
    name: 'changelogEntries',
    table: () => db.changelogEntries as Dexie.Table<unknown, string>,
    schema: ChangelogEntrySchema,
  },
  {
    name: 'competencyScores',
    table: () => db.competencyScores as Dexie.Table<unknown, string>,
    schema: CompetencyScoreSchema,
  },
  {
    name: 'knowledgeItems',
    table: () => db.knowledgeItems as Dexie.Table<unknown, string>,
    schema: KnowledgeItemSchema,
  },
  {
    name: 'hypotheses',
    table: () => db.hypotheses as Dexie.Table<unknown, string>,
    schema: HypothesisSchema,
  },
  {
    name: 'preferences',
    table: () => db.preferences as Dexie.Table<unknown, string>,
    schema: PreferenceSchema,
  },
  {
    name: 'moduleVisits',
    table: () => db.moduleVisits as Dexie.Table<unknown, string>,
    schema: ModuleVisitSchema,
  },
];

export const EXPORT_VERSION = 1;

export interface ExportEnvelope {
  version: number;
  exportedAt: string;
  pmOs: true;
  tables: Record<string, unknown[]>;
}

// Snapshot every Dexie table into a single JSON-serializable envelope.
export async function exportAll(): Promise<ExportEnvelope> {
  const tables: Record<string, unknown[]> = {};
  await Promise.all(
    TABLE_REGISTRY.map(async (entry) => {
      tables[entry.name] = await entry.table().toArray();
    })
  );
  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    pmOs: true,
    tables,
  };
}

export interface ImportTableResult {
  name: string;
  found: number; // rows present in the payload
  imported: number; // rows that passed validation and were upserted
  dropped: number; // rows dropped because they failed validation
}

export interface ImportResult {
  ok: boolean;
  error?: string;
  perTable: ImportTableResult[];
  totalImported: number;
  totalDropped: number;
  unknownTables: string[]; // payload keys that don't map to any current table
}

// Validate the envelope shape with a small inline guard — full schema is
// overkill since the tables map is intentionally heterogeneous.
function isEnvelope(x: unknown): x is ExportEnvelope {
  return (
    typeof x === 'object' &&
    x !== null &&
    'version' in x &&
    typeof (x as { version: unknown }).version === 'number' &&
    'tables' in x &&
    typeof (x as { tables: unknown }).tables === 'object' &&
    (x as { tables: unknown }).tables !== null
  );
}

// Validate a row with its schema, log on failure, return null. Inline rather
// than going through safeRows — we batch dropped rows across all tables into a
// single Sentry event at the end of the import (importAll runs all 20 tables
// in one shot, so 20× Sentry calls per import would flood the quota).
function validateRow<T>(
  schema: z.ZodType<T>,
  row: unknown,
  tableName: string,
  dropped: { table: string; id: unknown; issues: string }[]
): T | null {
  const result = schema.safeParse(row);
  if (result.success) return result.data;
  const id = typeof row === 'object' && row !== null ? (row as { id?: unknown }).id : undefined;
  const issues = result.error.issues
    .slice(0, 2)
    .map((i) => `${i.path.join('.')}: ${i.message}`)
    .join('; ');
  console.warn(`[data-io] Dropped invalid row from ${tableName} (id=${String(id)}): ${issues}`);
  dropped.push({ table: tableName, id, issues });
  return null;
}

// Apply an import payload. Validates each row through its Zod schema, then
// bulk-puts the survivors inside a single Dexie rw-transaction so a mid-loop
// failure rolls everything back rather than half-committing the backup.
// Returns a per-table summary.
//
// Accepts:
//   - the v1 envelope: { version, exportedAt, pmOs, tables }
//   - a "legacy" flat payload: a flat `{ documents, decisions, ... }` object
//     (older exports predate the envelope; tolerated so existing backups still
//     restore)
// Future envelope versions (> EXPORT_VERSION) are rejected loudly rather than
// silently misinterpreted as v1.
export async function importAll(payload: unknown): Promise<ImportResult> {
  const empty = { perTable: [], totalImported: 0, totalDropped: 0, unknownTables: [] };

  // Accept either the envelope or the legacy flat shape.
  let tables: Record<string, unknown>;
  if (isEnvelope(payload)) {
    if (payload.version > EXPORT_VERSION) {
      return {
        ok: false,
        error: `Unsupported backup version ${payload.version} (this build understands up to v${EXPORT_VERSION}). Update PM OS before restoring this file.`,
        ...empty,
      };
    }
    tables = payload.tables as Record<string, unknown>;
  } else if (payload && typeof payload === 'object') {
    tables = payload as Record<string, unknown>;
  } else {
    return { ok: false, error: 'Import payload is not a JSON object', ...empty };
  }

  const knownNames = new Set(TABLE_REGISTRY.map((t) => t.name));
  // The envelope branch already extracted `tables`, so these sentinels only
  // matter in the legacy flat-payload branch — keep them filtered out either
  // way so the report doesn't mis-flag them as "unknown tables."
  const unknownTables = Object.keys(tables).filter(
    (k) => !knownNames.has(k) && k !== 'exportedAt' && k !== 'version' && k !== 'pmOs'
  );

  // Pre-validate every table's rows before opening the transaction. Dexie
  // transactions can't span microtasks freely on all browsers, so we want the
  // rw-block to be purely write work.
  const dropped: { table: string; id: unknown; issues: string }[] = [];
  const batches: { entry: (typeof TABLE_REGISTRY)[number]; rows: unknown[]; found: number }[] = [];
  for (const entry of TABLE_REGISTRY) {
    const raw = tables[entry.name];
    if (!Array.isArray(raw)) continue;
    const validated: unknown[] = [];
    for (const row of raw) {
      const ok = validateRow(entry.schema, row, entry.name, dropped);
      if (ok !== null) validated.push(ok);
    }
    batches.push({ entry, rows: validated, found: raw.length });
  }

  // All-or-nothing write — if any bulkPut throws, Dexie rolls back the whole
  // transaction and we surface ok:false to the caller.
  const participating = batches.map((b) => b.entry.table());
  try {
    if (batches.length > 0) {
      await db.transaction('rw', participating, async () => {
        for (const b of batches) {
          if (b.rows.length > 0) await b.entry.table().bulkPut(b.rows);
        }
      });
    }
  } catch (err) {
    console.error('[data-io] Import transaction failed, rolled back', err);
    Sentry.captureException(err, { tags: { area: 'data-io', op: 'import' } });
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Import transaction failed',
      ...empty,
    };
  }

  // Single aggregated Sentry event for the whole import, regardless of how
  // many tables had dropped rows.
  if (dropped.length > 0) {
    Sentry.captureMessage(`Dropped ${dropped.length} invalid row(s) during import`, {
      level: 'warning',
      tags: { area: 'data-io', op: 'import' },
      extra: { sample: dropped.slice(0, 10), total: dropped.length },
    });
  }

  const perTable: ImportTableResult[] = batches.map((b) => ({
    name: b.entry.name,
    found: b.found,
    imported: b.rows.length,
    dropped: b.found - b.rows.length,
  }));
  const totalImported = perTable.reduce((s, r) => s + r.imported, 0);
  const totalDropped = perTable.reduce((s, r) => s + r.dropped, 0);

  return { ok: true, perTable, totalImported, totalDropped, unknownTables };
}
