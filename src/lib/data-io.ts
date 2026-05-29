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
import { safeRows } from './schemas/safe-read';
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

// Apply an import payload. Bulk-puts (upsert by primary key) each table's rows
// after validating with safeRows so corrupt rows are dropped + logged rather
// than corrupting the DB. Returns a per-table summary.
//
// Tolerates a "legacy" payload — an older export that's a flat
// `{ documents, decisions, ... }` object without the envelope wrapper.
// Unknown keys are reported but not imported.
export async function importAll(payload: unknown): Promise<ImportResult> {
  // Accept either the envelope or the legacy flat shape.
  let tables: Record<string, unknown>;
  if (isEnvelope(payload)) {
    tables = payload.tables as Record<string, unknown>;
  } else if (payload && typeof payload === 'object') {
    tables = payload as Record<string, unknown>;
  } else {
    return {
      ok: false,
      error: 'Import payload is not a JSON object',
      perTable: [],
      totalImported: 0,
      totalDropped: 0,
      unknownTables: [],
    };
  }

  const knownNames = new Set(TABLE_REGISTRY.map((t) => t.name));
  const unknownTables = Object.keys(tables).filter(
    (k) => !knownNames.has(k) && k !== 'exportedAt' && k !== 'version' && k !== 'pmOs'
  );

  const perTable: ImportTableResult[] = [];
  let totalImported = 0;
  let totalDropped = 0;

  for (const entry of TABLE_REGISTRY) {
    const raw = tables[entry.name];
    if (!Array.isArray(raw)) {
      // No data for this table in the payload — skip without recording.
      continue;
    }
    const found = raw.length;
    const validated = safeRows(entry.schema, raw, entry.name);
    let imported = 0;
    if (validated.length > 0) {
      await entry.table().bulkPut(validated);
      imported = validated.length;
    }
    const dropped = found - imported;
    perTable.push({ name: entry.name, found, imported, dropped });
    totalImported += imported;
    totalDropped += dropped;
  }

  return { ok: true, perTable, totalImported, totalDropped, unknownTables };
}
