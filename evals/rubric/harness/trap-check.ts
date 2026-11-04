/* eslint-disable -- eval-only harness run by Bun, outside the app lint rules. */
// @ts-nocheck: Bun-only eval harness; kept out of the app typecheck.
/**
 * Fixed text-pattern "trap" checks for the new cases (fixtures-new-cases.json). No model call.
 * A trap that matches is a miss: for example a cycle length called standard, or an invented email.
 * Reads one or more results files written by run.ts and prints every match with its sentence.
 *
 * Usage: bun --no-install evals/rubric/harness/trap-check.ts evals/rubric/fixtures-new-cases.json <results.json> ...
 */
import { readFileSync } from 'node:fs';

const [fixturesFile, ...files] = process.argv.slice(2);
const DS = JSON.parse(readFileSync(fixturesFile, 'utf8'));
const plain = (t: string) => t.replace(/\*\*|__/g, '');
const sentences = (t: string) => t.split('\n').flatMap((l) => l.split(/(?<=[.!?])\s+(?=[A-Z])/));

export function trapHits(output: string, inputText: string, traps: any[]) {
  const text = plain(output);
  const hits: any[] = [];
  for (const t of traps) {
    if (t.re) {
      for (const s of sentences(text)) {
        const m = s.match(new RegExp(t.re, 'i'));
        // A match that is copied from the input is not a miss.
        if (m && !inputText.includes(m[0]))
          hits.push({ trap: t.label, match: m[0], sentence: s.trim().slice(0, 300) });
      }
    }
    if (t.sentence_re) {
      for (const s of sentences(text)) {
        if (new RegExp(t.sentence_re, 'i').test(s) && !new RegExp(t.unless_re, 'i').test(s))
          hits.push({ trap: t.label, sentence: s.trim().slice(0, 300) });
      }
    }
  }
  return hits;
}

const all: any = {};
for (const f of files) {
  const d = JSON.parse(readFileSync(f, 'utf8'));
  const perFile: any = {};
  for (const r of d.results.filter((x: any) => !x.error)) {
    const m = DS.modules.find((x: any) => x.key === r.key);
    if (!m?.traps) continue;
    const inputText = m.sections.map((s: any) => s.value).join('\n');
    perFile[r.key] = trapHits(r.output, inputText, m.traps);
  }
  all[f.split('/').pop()] = perFile;
}
for (const [f, per] of Object.entries(all)) {
  const n = Object.values(per as any).reduce((a: number, h: any) => a + h.length, 0);
  const mods = Object.values(per as any).filter((h: any) => h.length === 0).length;
  console.log(`${f}: ${n} trap hits; ${mods}/${Object.keys(per as any).length} modules with none`);
  for (const [k, hits] of Object.entries(per as any))
    for (const h of hits as any[])
      console.log(`  ${k} [${h.trap}] ${h.match ?? ''} :: ${h.sentence}`);
}
