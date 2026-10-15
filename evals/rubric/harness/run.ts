/* eslint-disable -- eval-only harness run by Bun, outside the app lint rules. */
// @ts-nocheck: Bun-only eval harness (import.meta.dir/main, .mjs shim); kept out of the app typecheck.
/**
 * pm-os rubric eval. Builds each module prompt with the real buildModulePrompt()
 * (src/lib/ai.ts + ai-prompts.ts + getOutputName), sends it through the Claude Code
 * CLI with the Anthropic provider's default model, and grades the markdown:
 *  - required sections and framework markers: deterministic regexes (fixtures.json)
 *  - invented metrics: deterministic extraction of metric-like figures not in the
 *    input, then an LLM judge (one CLI call per module) classifies each sentence
 *
 * Usage: evals/rubric/harness/setup-shims.sh && bun --no-install evals/rubric/harness/run.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildModulePrompt } from '../../../src/lib/ai';
import { getModule } from '../../../src/lib/constants';
import { getOutputName } from '../../../src/lib/output-names';
import { CALL_LOG, callClaude } from './claude-cli.mjs';

const GEN_MODEL = process.env.EVAL_MODEL ?? 'claude-sonnet-4-6'; // anthropic provider defaultModel
const JUDGE_MODEL = process.env.EVAL_JUDGE_MODEL ?? 'claude-opus-5-5';
const PROD_MAX_TOKENS = 4000; // providers/anthropic.ts default maxTokens
export const DS = JSON.parse(readFileSync(resolve(import.meta.dir, '..', 'fixtures.json'), 'utf8'));
const only = process.env.EVAL_ONLY?.split(',');

const rx = (s: string, flags = 'im') => new RegExp(s, flags);

/** Markdown emphasis (**bold**, __bold__) splits phrases like "**When** ... **I want to**"; grade the plain text. */
export const plain = (t: string) => t.replace(/\*\*|__/g, '');

export function check(text: string, spec: any): boolean {
  text = plain(text);
  if (spec.re) return rx(spec.re).test(text);
  if (spec.exec_summary) {
    if (/^#{1,3} .*(executive summary|summary|tl;dr|bottom line)/im.test(text)) return true;
    const afterTitle = text.split('\n').slice(1).join('\n').split(/^## /m)[0];
    return afterTitle
      .split(/\n\s*\n/)
      .some((p) => !/^\s*(#|>|\||-|\*\*[^*]+\*\*\s*$)/.test(p.trim()) && p.trim().length >= 300);
  }
  if (spec.all_re) return spec.all_re.every((r: string) => rx(r).test(text));
  if (spec.count_re) {
    const n = (text.match(rx(spec.count_re, 'gim')) ?? []).length;
    return n >= spec.min && (!spec.also_re || rx(spec.also_re).test(text));
  }
  if (spec.kr_measurable) {
    const lines = text.split('\n').filter((l) => /\bKR\s?\d/i.test(l));
    if (lines.length === 0) return false;
    const measurable = lines.filter((l) => /\d/.test(l.replace(/\bKR\s?\d+(\.\d+)?/gi, ''))).length;
    return measurable / lines.length >= 0.8;
  }
  throw new Error('bad spec');
}

// Metric-like figures: percentages, money, multipliers, magnitudes, counts with a unit.
const METRIC =
  /([$€£]\s?\d[\d,.]*\s?(?:k|m|b|bn|million|billion|thousand)?|\d[\d,.]*\s?%|\d[\d,.]*\s?x\b|\d[\d,.]*\s?(?:k|m|bn|million|billion|thousand)\b|\b\d[\d,.]*\s+(?:clinics|customers|users|owners|vets|appointments|bookings|reminders|messages|days|hours|minutes|weeks|months|seconds|ms|visits|signups|accounts|reviews|calls|staff|practices|pets|sessions|points|tickets|slots))/gi;
const numOf = (t: string) => {
  const m = t.replace(/,/g, '').match(/\d+(\.\d+)?/);
  return m ? String(parseFloat(m[0])) : null;
};

function newMetricSentences(output: string, inputText: string): string[] {
  const inputNums = new Set(
    (inputText.replace(/,/g, '').match(/\d+(\.\d+)?/g) ?? []).map((n) => String(parseFloat(n)))
  );
  const units = output.split('\n').flatMap((l) => l.split(/(?<=[.!?])\s+(?=[A-Z])/));
  const out: string[] = [];
  for (const u of units) {
    const toks = u.match(METRIC) ?? [];
    if (
      toks.some((t) => {
        const n = numOf(t);
        return n !== null && !inputNums.has(n);
      })
    )
      out.push(u.trim().slice(0, 400));
  }
  return [...new Set(out)];
}

const JUDGE_SYSTEM = `You grade product-management documents for invented metrics. You will get the PM's INPUT (the only facts provided) and numbered SENTENCES taken from the generated document, each containing at least one figure that does not appear literally in the input.
Classify each sentence:
- INPUT: the figure restates or is directly computed from input figures (for example a difference, a ratio or a sum).
- LABELLED: the figure is a proposal, target, assumption, estimate, example, threshold, plan parameter or placeholder, and the sentence or its row/heading makes that clear (words like target, goal, assume, estimate, hypothesis, proposed, example, TBD, or a targets/assumptions table).
- UNSOURCED_FACT: the figure is presented as an established fact about the product, its users, the market or an industry benchmark, with no label and no basis in the input.
Judge only how the figure is presented, not whether it is plausible.`;
const JUDGE_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          n: { type: 'integer' },
          verdict: { type: 'string', enum: ['INPUT', 'LABELLED', 'UNSOURCED_FACT'] },
          reason: { type: 'string' },
        },
        required: ['n', 'verdict', 'reason'],
        additionalProperties: false,
      },
    },
  },
  required: ['items'],
  additionalProperties: false,
};

async function evalModule(m: any) {
  const [category, slug] = m.key.split('/');
  const mod = getModule(category, slug);
  if (!mod) throw new Error('unknown module ' + m.key);
  const { system, user } = buildModulePrompt(
    category,
    slug,
    getOutputName(slug, mod.name),
    m.title,
    m.sections
  );
  const gen = await callClaude({
    model: GEN_MODEL,
    system,
    messages: [{ role: 'user', content: user }],
    label: m.key + ':gen',
  });
  if (!gen.ok) return { key: m.key, error: gen.text.slice(0, 300) };
  const text = gen.text;
  const required = [...DS.common.required, ...m.required].map((r: any) => ({
    label: r.label,
    ok: check(text, r),
  }));
  const framework = m.framework.map((f: any) => ({ label: f.label, ok: check(text, f) }));
  const inputText = m.sections.map((s: any) => s.value).join('\n');
  const sentences = newMetricSentences(text, inputText);
  let judged: any[] = [];
  if (sentences.length) {
    const ju = await callClaude({
      model: JUDGE_MODEL,
      system: JUDGE_SYSTEM,
      schema: JUDGE_SCHEMA,
      label: m.key + ':judge',
      messages: [
        {
          role: 'user',
          content: `INPUT:\n${m.sections.map((s: any) => `### ${s.label}\n${s.value}`).join('\n\n')}\n\nSENTENCES:\n${sentences.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
        },
      ],
    });
    judged = (ju.structured?.items ?? []).map((it: any) => ({
      ...it,
      sentence: sentences[it.n - 1],
    }));
    if (!ju.structured) judged = [{ n: 0, verdict: 'JUDGE_FAILED', reason: ju.text.slice(0, 200) }];
  }
  const visibleOut = (gen.rec.usage?.output_tokens ?? 0) - (gen.rec.usage?.thinking_tokens ?? 0);
  return {
    key: m.key,
    model: gen.rec.models,
    ms: gen.ms,
    outputTokensVisible: visibleOut,
    chars: text.length,
    wouldExceedProdMaxTokens: visibleOut > PROD_MAX_TOKENS,
    required,
    requiredPass: required.every((r: any) => r.ok),
    framework,
    frameworkPass: framework.every((f: any) => f.ok),
    newMetricSentences: sentences.length,
    judged,
    unsourcedFacts: judged.filter((j) => j.verdict === 'UNSOURCED_FACT').length,
    output: text,
  };
}

if (import.meta.main) await main();

async function main() {
  const started = new Date().toISOString();
  const t0 = Date.now();
  const mods = DS.modules.filter((m: any) => !only || only.includes(m.key));
  const results: any[] = new Array(mods.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: 3 }, async () => {
      while (i < mods.length) {
        if (CALL_LOG.some((c: any) => c.limit_hit))
          throw new Error('CLI usage limit hit; stopping');
        const k = i++;
        results[k] = await evalModule(mods[k]);
      }
    })
  );
  const wallMs = Date.now() - t0;
  const lat = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b);
    return {
      n: s.length,
      p50: s[Math.floor(s.length / 2)],
      p90: s[Math.min(s.length - 1, Math.floor(s.length * 0.9))],
      max: s[s.length - 1],
    };
  };
  const gens = CALL_LOG.filter((c: any) => c.label.endsWith(':gen'));
  const judges = CALL_LOG.filter((c: any) => c.label.endsWith(':judge'));
  const ok = results.filter((r) => !r.error);
  const summary = {
    started,
    rubricSha256: new Bun.CryptoHasher('sha256')
      .update(readFileSync(resolve(import.meta.dir, '..', 'fixtures.json')))
      .digest('hex'),
    wallMs,
    generationModel: GEN_MODEL,
    judgeModel: JUDGE_MODEL,
    modelsAnswered: [...new Set(CALL_LOG.flatMap((c: any) => c.models))],
    cliCalls: CALL_LOG.length,
    cliErrors: CALL_LOG.filter((c: any) => c.is_error).length,
    generationLatencyMs: lat(gens.map((c: any) => c.ms)),
    judgeLatencyMs: lat(judges.map((c: any) => c.ms)),
    usageTotals: CALL_LOG.reduce(
      (a: any, c: any) => {
        if (c.usage) {
          a.input +=
            c.usage.input_tokens +
            (c.usage.cache_read_input_tokens ?? 0) +
            (c.usage.cache_creation_input_tokens ?? 0);
          a.output += c.usage.output_tokens;
        }
        return a;
      },
      { input: 0, output: 0 }
    ),
    modules: results.length,
    generated: ok.length,
    requiredSectionsAllPresent: ok.filter((r) => r.requiredPass).length,
    requiredSectionChecks: {
      passed: ok.reduce((a, r) => a + r.required.filter((x: any) => x.ok).length, 0),
      total: ok.reduce((a, r) => a + r.required.length, 0),
    },
    frameworkFollowed: ok.filter((r) => r.frameworkPass).length,
    frameworkChecks: {
      passed: ok.reduce((a, r) => a + r.framework.filter((x: any) => x.ok).length, 0),
      total: ok.reduce((a, r) => a + r.framework.length, 0),
    },
    sentencesWithNewFigures: ok.reduce((a, r) => a + r.newMetricSentences, 0),
    judgeVerdicts: ok
      .flatMap((r) => r.judged)
      .reduce((a: any, j: any) => ((a[j.verdict] = (a[j.verdict] ?? 0) + 1), a), {}),
    modulesWithNoUnsourcedFacts: ok.filter((r) => r.unsourcedFacts === 0).length,
    modulesOverProdMaxTokens: ok.filter((r) => r.wouldExceedProdMaxTokens).map((r) => r.key),
    errors: results.filter((r) => r.error),
  };
  const file = resolve(
    import.meta.dir,
    '..',
    'results',
    `${started.slice(0, 10)}-claude-cli${only ? '-partial' : ''}${process.env.EVAL_TAG ? '-' + process.env.EVAL_TAG : ''}.json`
  );
  writeFileSync(
    file,
    JSON.stringify(
      {
        method:
          "Claude Code CLI (claude -p) with the app's own buildModulePrompt output; not the production API path",
        summary,
        results,
        calls: CALL_LOG,
      },
      null,
      2
    )
  );
  console.log(JSON.stringify(summary, null, 2));
  console.log('wrote', file);
}
