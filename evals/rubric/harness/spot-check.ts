/* eslint-disable -- eval-only harness run by Bun, outside the app lint rules. */
// @ts-nocheck: Bun-only eval harness (import.meta.dir/main, .mjs shim); kept out of the app typecheck.
/**
 * Ungraded spot-check (n=1 per module) for modules outside the rubric set: generates each
 * once through the same claude-cli path as run.ts and records length, headings and whether
 * the document ends with a Next Steps section. No rubric, no judge.
 *
 * Usage: evals/rubric/harness/setup-shims.sh && bun --no-install evals/rubric/harness/spot-check.ts
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildAnalysisPrompt, buildModulePrompt } from '../../../src/lib/ai';
import { getModule } from '../../../src/lib/constants';
import { getOutputName } from '../../../src/lib/output-names';
import { CALL_LOG, callClaude } from './claude-cli.mjs';

const GEN_MODEL = process.env.EVAL_MODEL ?? 'claude-sonnet-4-6';
const PROD_MAX_TOKENS = 4000;

// Fictional inputs about the same made-up product as fixtures.json (Pawpath by Fernway Labs).
const DOCS = [
  {
    key: 'specs/api-docs',
    title: 'Pawpath Booking API v1',
    sections: [
      {
        label: 'API Overview',
        value:
          'REST API for partner clinics to read availability and create bookings. Base URL https://api.pawpath.example/v1. JSON only.',
      },
      {
        label: 'Endpoints',
        value:
          'GET /slots?clinic_id&date: free slots for a day. POST /bookings: create a booking (clinic_id, slot_id, pet_id, owner_phone). DELETE /bookings/{id}: cancel. GET /bookings/{id}: booking status.',
      },
      {
        label: 'Authentication',
        value:
          'Per-clinic API key in the Authorization: Bearer header. Keys are created in clinic settings.',
      },
      {
        label: 'Error Codes',
        value:
          '400 invalid input, 401 bad key, 404 unknown slot or booking, 409 slot already taken.',
      },
      {
        label: 'Rate Limiting',
        value: '120 requests per minute per key. 429 with Retry-After when exceeded.',
      },
    ],
  },
  {
    key: 'communication/release-notes',
    title: 'Pawpath 3.4 Release Notes',
    sections: [
      { label: 'Version / Release', value: 'Pawpath 3.4, November 2026' },
      {
        label: 'Highlights',
        value:
          'Online rebooking from the reminder text; waitlist that fills cancelled slots; clinic-wide SMS sender name.',
      },
      {
        label: 'New Features',
        value:
          'Rebook link in reminder SMS. Waitlist with automatic offer when a slot frees up. Custom SMS sender name per clinic.',
      },
      {
        label: 'Improvements',
        value: 'Day view loads faster on large clinics. Reminder templates support the pet name.',
      },
      {
        label: 'Bug Fixes',
        value:
          'Fixed double booking when two staff edited the same slot within a second. Fixed time zone shown in reminders for clinics near a border.',
      },
      {
        label: 'Breaking Changes',
        value: 'The old /v0/bookings export endpoint is removed; use /v1/bookings.',
      },
    ],
  },
  {
    key: 'communication/meeting-notes',
    title: 'Pawpath Weekly Product Sync, 12 Oct',
    sections: [
      { label: 'Attendees', value: 'PM, engineering lead, design lead, support lead' },
      { label: 'Agenda', value: 'Waitlist beta feedback; SMS cost; Q4 roadmap check' },
      {
        label: 'Discussion Notes',
        value:
          'Beta clinics like the waitlist but want to cap offers per slot. SMS cost rose after the rebook link launched. Roadmap: lab integration still blocked on partner contract.',
      },
      {
        label: 'Decisions Made',
        value: 'Cap waitlist offers at 3 per slot. Keep rebook link on; revisit cost at month end.',
      },
      {
        label: 'Action Items',
        value:
          'Eng lead: offer cap by 20 Oct. Support lead: collect 5 beta clinic quotes by 19 Oct. PM: SMS cost review on 31 Oct.',
      },
    ],
  },
  {
    key: 'specs/tech-spec',
    title: 'Pawpath Waitlist Service',
    sections: [
      {
        label: 'Technical Overview',
        value:
          'New waitlist service that offers a freed slot to waiting pet owners by SMS, first come first served.',
      },
      {
        label: 'System Design',
        value:
          'Booking service emits slot.freed events; waitlist service consumes them, picks up to 3 owners, sends SMS offers through the existing notification service, and holds the slot for 15 minutes.',
      },
      {
        label: 'Data Model',
        value:
          'waitlist_entry(id, clinic_id, pet_id, owner_phone, earliest, latest, created_at); offer(id, entry_id, slot_id, status, expires_at).',
      },
      { label: 'Performance', value: 'Offer SMS within 60 seconds of a slot freeing.' },
      { label: 'Rollout Plan', value: 'Feature flag per clinic; beta with 10 clinics, then all.' },
    ],
  },
];

// Same shape as the Assumption Tracker's getData(): "title (status, impact:n, confidence:n)" per line.
const ANALYSIS = {
  key: 'discovery/assumptions',
  data: [
    'Clinics will let owners rebook online without staff approval (untested, impact:5, confidence:2)',
    'Owners read reminder SMS within an hour (validated, impact:4, confidence:4)',
    'Waitlist offers fill most cancelled slots (testing, impact:4, confidence:3)',
    'Clinics accept a per-SMS charge on top of the subscription (invalidated, impact:3, confidence:1)',
    'Front desk staff will maintain the waitlist manually when owners call (untested, impact:2, confidence:2)',
  ].join('\n'),
};

const record = (key: string, kind: string, gen: any) => {
  const text = gen.text ?? '';
  const headings = text.split('\n').filter((l: string) => /^#{1,2} /.test(l));
  const visibleOut = (gen.rec?.usage?.output_tokens ?? 0) - (gen.rec?.usage?.thinking_tokens ?? 0);
  return {
    key,
    kind,
    ok: gen.ok,
    ms: gen.ms,
    outputTokensVisible: visibleOut,
    overProdMaxTokens: visibleOut > PROD_MAX_TOKENS,
    headings,
    endsWithNextSteps: /next steps/i.test(headings[headings.length - 1] ?? ''),
    hasExecutiveSummary: /executive summary/i.test(text),
    output: text,
  };
};

const results: any[] = [];
for (const d of DOCS) {
  if (CALL_LOG.some((c: any) => c.limit_hit)) throw new Error('CLI usage limit hit; stopping');
  const [category, slug] = d.key.split('/');
  const mod = getModule(category, slug);
  if (!mod) throw new Error('unknown module ' + d.key);
  const { system, user } = buildModulePrompt(
    category,
    slug,
    getOutputName(slug, mod.name),
    d.title,
    d.sections
  );
  results.push(
    record(
      d.key,
      'document',
      await callClaude({
        model: GEN_MODEL,
        system,
        messages: [{ role: 'user', content: user }],
        label: d.key + ':gen',
      })
    )
  );
}
{
  if (CALL_LOG.some((c: any) => c.limit_hit)) throw new Error('CLI usage limit hit; stopping');
  const [category, slug] = ANALYSIS.key.split('/');
  const { system, user } = buildAnalysisPrompt(category, slug, ANALYSIS.data);
  results.push(
    record(
      ANALYSIS.key,
      'analysis',
      await callClaude({
        model: GEN_MODEL,
        system,
        messages: [{ role: 'user', content: user }],
        label: ANALYSIS.key + ':analysis',
      })
    )
  );
}

const file = resolve(
  import.meta.dir,
  '..',
  'results',
  `${new Date().toISOString().slice(0, 10)}-spot-check.json`
);
writeFileSync(
  file,
  JSON.stringify(
    {
      method: 'Claude Code CLI (claude -p), n=1 per module, not graded by the rubric',
      generationModel: GEN_MODEL,
      results,
      calls: CALL_LOG,
    },
    null,
    2
  )
);
console.log(
  JSON.stringify(
    results.map(({ output, ...r }) => r),
    null,
    2
  )
);
console.log('wrote', file);
