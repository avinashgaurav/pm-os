/* eslint-disable -- eval-only harness run by Bun, outside the app lint rules. */
// @ts-nocheck: Bun-only eval harness (import.meta.dir/main, .mjs shim); kept out of the app typecheck.
// Re-grades a saved results file with the current deterministic checks (no CLI calls).
// Usage: bun --no-install evals/rubric/harness/rescore.ts evals/rubric/results/<file>.json
import { readFileSync, writeFileSync } from 'node:fs';
import { DS, check } from './run';
const f = process.argv[2]!;
const d = JSON.parse(readFileSync(f, 'utf8'));
for (const r of d.results) {
  const m = DS.modules.find((x: any) => x.key === r.key);
  r.required = [...DS.common.required, ...m.required].map((q: any) => ({
    label: q.label,
    ok: check(r.output, q),
  }));
  r.framework = m.framework.map((q: any) => ({ label: q.label, ok: check(r.output, q) }));
  r.requiredPass = r.required.every((x: any) => x.ok);
  r.frameworkPass = r.framework.every((x: any) => x.ok);
}
const ok = d.results.filter((r: any) => !r.error);
Object.assign(d.summary, {
  requiredSectionsAllPresent: ok.filter((r: any) => r.requiredPass).length,
  requiredSectionChecks: {
    passed: ok.reduce((a: number, r: any) => a + r.required.filter((x: any) => x.ok).length, 0),
    total: ok.reduce((a: number, r: any) => a + r.required.length, 0),
  },
  frameworkFollowed: ok.filter((r: any) => r.frameworkPass).length,
  frameworkChecks: {
    passed: ok.reduce((a: number, r: any) => a + r.framework.filter((x: any) => x.ok).length, 0),
    total: ok.reduce((a: number, r: any) => a + r.framework.length, 0),
  },
  rescoredAt: new Date().toISOString(),
});
writeFileSync(f, JSON.stringify(d, null, 2));
for (const r of ok)
  console.log(
    r.key,
    'req miss:',
    r.required.filter((x: any) => !x.ok).map((x: any) => x.label),
    'fw miss:',
    r.framework.filter((x: any) => !x.ok).map((x: any) => x.label)
  );
console.log(
  JSON.stringify({
    req: d.summary.requiredSectionsAllPresent,
    reqChecks: d.summary.requiredSectionChecks,
    fw: d.summary.frameworkFollowed,
    fwChecks: d.summary.frameworkChecks,
  })
);
