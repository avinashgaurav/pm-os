#!/usr/bin/env tsx
/**
 * Prompt regression eval harness.
 *
 * Reads fixture inputs from evals/fixtures/<category>__<module>.json, runs the
 * current prompt against the configured provider, and writes the output to
 * evals/snapshots/<category>__<module>.md. On `--check`, exits non-zero if any
 * snapshot drifts — the failing PR shows a clear before/after diff.
 *
 * Usage:
 *   npx tsx scripts/eval-prompts.ts            # write/refresh snapshots
 *   npx tsx scripts/eval-prompts.ts --check    # CI mode: fail on drift
 *   npx tsx scripts/eval-prompts.ts --only specs/prd
 *
 * Env: requires at least one provider API key (GROQ_API_KEY, OPENAI_API_KEY,
 * ANTHROPIC_API_KEY, GOOGLE_API_KEY, or OLLAMA_URL). Picks the first
 * configured provider in the order Groq → OpenAI → Anthropic → Gemini → Ollama.
 *
 * Add a fixture for a new module by dropping a JSON file at
 *   evals/fixtures/<category>__<moduleSlug>.json
 * with shape { title: string, sections: { label: string; value: string }[] }.
 */

import { readFile, writeFile, readdir, mkdir, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildModulePrompt } from '../src/lib/ai';
import { listProviders } from '../src/lib/providers';
import { getOutputName } from '../src/lib/output-names';
import { getModule } from '../src/lib/constants';

interface Fixture {
  title: string;
  sections: { label: string; value: string }[];
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURES_DIR = join(ROOT, 'evals/fixtures');
const SNAPSHOTS_DIR = join(ROOT, 'evals/snapshots');

const args = process.argv.slice(2);
const CHECK_MODE = args.includes('--check');
const onlyIdx = args.indexOf('--only');
const ONLY = onlyIdx >= 0 ? args[onlyIdx + 1] : null;
if (onlyIdx >= 0 && !ONLY) {
  console.error('[eval] --only requires an argument, e.g. --only specs/prd');
  process.exit(2);
}

function pickProvider() {
  const configured = listProviders().filter((p) => p.isConfigured());
  if (configured.length === 0) {
    console.error('[eval] No providers configured. Set GROQ_API_KEY, OPENAI_API_KEY,');
    console.error('       ANTHROPIC_API_KEY, GOOGLE_API_KEY, or OLLAMA_URL.');
    process.exit(2);
  }
  // Stable order so snapshots don't drift just because a different key is set.
  const order = ['groq', 'openai', 'anthropic', 'gemini', 'ollama'];
  return [...configured].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))[0];
}

async function readFixture(
  file: string
): Promise<{ category: string; moduleSlug: string; fixture: Fixture }> {
  // Convention: evals/fixtures/<category>__<moduleSlug>.json (double underscore
  // because some module slugs contain a single underscore).
  const base = file.replace(/\.json$/, '');
  const idx = base.indexOf('__');
  if (idx < 0) throw new Error(`Fixture filename missing "__" separator: ${file}`);
  const category = base.slice(0, idx);
  const moduleSlug = base.slice(idx + 2);
  const raw = await readFile(join(FIXTURES_DIR, file), 'utf-8');
  const fixture = JSON.parse(raw) as Fixture;
  return { category, moduleSlug, fixture };
}

function snapshotPath(category: string, moduleSlug: string) {
  return join(SNAPSHOTS_DIR, `${category}__${moduleSlug}.md`);
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

interface Result {
  key: string;
  status: 'unchanged' | 'updated' | 'new' | 'drifted' | 'error';
  bytes: number;
}

async function runOne(
  provider: ReturnType<typeof pickProvider>,
  category: string,
  moduleSlug: string,
  fixture: Fixture
): Promise<Result> {
  const key = `${category}/${moduleSlug}`;
  const mod = getModule(category, moduleSlug);
  if (!mod) throw new Error(`Unknown module: ${key}`);
  const outputName = getOutputName(moduleSlug, mod.name);
  const { system, user } = buildModulePrompt(
    category,
    moduleSlug,
    outputName,
    fixture.title,
    fixture.sections
  );

  const result = await provider.generate({
    system,
    user,
    model: provider.defaultModel,
    temperature: 0, // Determinism: providers honor this best-effort.
  });

  const header = [
    `<!-- snapshot: ${key} -->`,
    `<!-- provider: ${provider.id} · model: ${provider.defaultModel} -->`,
    '',
  ].join('\n');
  const body = `${header}${result.text.trim()}\n`;

  const path = snapshotPath(category, moduleSlug);
  const exists = await fileExists(path);

  if (CHECK_MODE) {
    if (!exists) return { key, status: 'new', bytes: body.length };
    const current = await readFile(path, 'utf-8');
    return {
      key,
      status: current === body ? 'unchanged' : 'drifted',
      bytes: body.length,
    };
  }

  await mkdir(SNAPSHOTS_DIR, { recursive: true });
  if (!exists) {
    await writeFile(path, body);
    return { key, status: 'new', bytes: body.length };
  }
  const current = await readFile(path, 'utf-8');
  if (current === body) return { key, status: 'unchanged', bytes: body.length };
  await writeFile(path, body);
  return { key, status: 'updated', bytes: body.length };
}

async function main() {
  const provider = pickProvider();
  console.log(`[eval] Using ${provider.label} · ${provider.defaultModel}`);
  console.log(`[eval] Mode: ${CHECK_MODE ? 'check' : 'update'}`);

  let fixtures: string[];
  try {
    fixtures = (await readdir(FIXTURES_DIR)).filter((f) => f.endsWith('.json')).sort();
  } catch {
    console.error(`[eval] No fixtures dir at ${FIXTURES_DIR}`);
    process.exit(2);
  }

  if (ONLY) {
    const want = ONLY.replace('/', '__') + '.json';
    fixtures = fixtures.filter((f) => f === want);
    if (fixtures.length === 0) {
      console.error(`[eval] --only ${ONLY} matched no fixtures`);
      process.exit(2);
    }
  }

  const results: Result[] = [];
  for (const file of fixtures) {
    try {
      const { category, moduleSlug, fixture } = await readFixture(file);
      console.log(`[eval] ${category}/${moduleSlug} …`);
      const r = await runOne(provider, category, moduleSlug, fixture);
      results.push(r);
    } catch (err) {
      console.error(`[eval] FAILED ${file}: ${err instanceof Error ? err.message : err}`);
      // 'error' (infra/provider failure) is distinct from 'drifted' (a real
      // prompt-output change) so CI logs don't mislabel a network blip as a
      // regression. Both still fail --check.
      results.push({ key: file, status: 'error', bytes: 0 });
    }
  }

  // Summary
  const counts = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
  console.log('\n[eval] Summary:');
  for (const r of results) console.log(`  ${r.status.padEnd(10)} ${r.key}`);
  console.log(`  total: ${results.length} | ${JSON.stringify(counts)}`);

  if (CHECK_MODE) {
    const errored = results.filter((r) => r.status === 'error');
    if (errored.length > 0) {
      console.error(`\n[eval] ${errored.length} fixture(s) FAILED to run (infra/provider error).`);
      console.error('       This is not a prompt regression — check provider availability.');
      process.exit(1);
    }
    const drifted = results.filter((r) => r.status === 'drifted' || r.status === 'new');
    if (drifted.length > 0) {
      console.error(`\n[eval] DRIFT detected on ${drifted.length} snapshot(s).`);
      console.error('       Re-run without --check to refresh, then commit the diff.');
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error('[eval] Fatal:', err);
  process.exit(2);
});
