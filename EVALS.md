# pm-os module output eval

First-pass rubric eval of the module generator: `buildModulePrompt` in `src/lib/ai.ts` with the per-module prompts in `src/lib/ai-prompts.ts`. Run on 2026-10-15, then rerun twice the same day: after a first prompt fix (round 1) and after a second prompt fix (round 2). See "Before and after the fix".

**Method note.** Measured via the Claude Code CLI with the app's own prompts and schema, not the production API path; an API rerun is planned.

## Why not the existing `eval-prompts` setup

`scripts/eval-prompts.ts` and `.github/workflows/eval-prompts.yml` are a snapshot-drift check, not a quality eval:

- They store one output per fixture and fail when the next output differs.
- There is no committed baseline (`evals/snapshots/` holds only `.gitkeep`) and no rubric.
- They need a provider API key, and they pick Groq first.
- The 5 fixtures in `evals/fixtures/` reference real third-party brands.

So this eval does not use them. It is a separate rubric eval in `evals/rubric/` that reuses the same production entry points as `eval-prompts.ts`: `buildModulePrompt`, `getModule` and `getOutputName`. The snapshot setup is untouched.

How it runs (`evals/rubric/harness/run.ts`):

- **Generation.** Each module prompt goes through `claude -p` with `--system-prompt` set to the app's system prompt, `--tools ""`, `--strict-mcp-config`, `--setting-sources ""`, `--no-session-persistence` and `--model claude-sonnet-4-6`, the Anthropic provider's `defaultModel`. There is no `--json-schema`: the app asks for markdown, not structured output.
- **Load-time imports.** `ai.ts` loads `@sentry/nextjs` and `zod` at import time. `setup-shims.sh` puts a no-op Sentry stub and a standalone zod in the gitignored `node_modules`, instead of a full `npm ci`.

Differences from the API path:

- **No temperature or `max_tokens`.** Production sends `temperature` (0.7 default, 0 in `eval-prompts.ts`) and `maxTokens: 4000`; the CLI passes neither.
- **The CLI added extended thinking** (thinking tokens are excluded from the counts below).
- **No `--bare`.** It needs `ANTHROPIC_API_KEY`, and this run used a plan login.

## Dataset

10 fictional module inputs about a made-up product: Pawpath, appointment software for independent vet clinics, made by the made-up Fernway Labs. File: `evals/rubric/fixtures.json`.

Modules: PRD, OKRs, Jobs-to-be-Done, risk register, North Star, positioning (Dunford), A/B test design, user stories, SWOT, and market sizing.

The required sections and framework markers for each module were written before the run, taken from that module's own system prompt and the shared format rules (summary first, prioritised next steps last).

## Rubric and metrics

1. **Required sections (deterministic regex).** 88 checks in total: 3 common (H1 title, executive summary, next steps) plus each module's own list. Example: the A/B module needs hypothesis, primary metric, guardrails, MDE, sample size, duration, randomisation unit, analysis plan and pitfalls.
2. **Named framework followed (deterministic regex).** 15 checks. Examples:
   - JTBD needs 3 or more "When ..., I want to ..., so I can ..." statements.
   - OKRs need 2 or more objectives, 6 or more KRs, and at least 80% of KRs with a number.
   - SWOT needs SO, WO, ST and WT strategies.
   - Market sizing needs both top-down and bottom-up.
   - A/B design needs an If/then/because hypothesis.
3. **No invented metrics presented as facts.**
   - **Deterministic step.** Every sentence or table row with a metric-like figure (%, money, multiplier, magnitude, or a count with a unit) whose number is not in the input is extracted.
   - **LLM judge** (`claude-opus-5-5`, one CLI call per module, JSON schema). The judge labels each extracted sentence as one of:
     - `INPUT`: restated or computed from the input
     - `LABELLED`: a clearly marked target, assumption, estimate or example
     - `UNSOURCED_FACT`: presented as fact with no basis

     The judge grades presentation, not plausibility.

4. **Length.** Visible output tokens against the production `maxTokens: 4000`.

Two harness fixes were made after the run. Both are formatting fixes, applied by re-grading the saved outputs with `rescore.ts`, with no new model calls:

- Bold markers are stripped before matching, because "**When** ... **I want to**" split the phrase.
- User stories may wrap across lines.

Both are recorded in the results file.

## Results (first run, before the fix)

| Metric                                            | Result                                |
| ------------------------------------------------- | ------------------------------------- |
| Modules generated                                 | 10 / 10                               |
| Required-section checks passed                    | 87 / 88                               |
| Modules with every required section               | 9 / 10 (10 / 10 after manual review)  |
| Framework checks passed                           | 14 / 15                               |
| Modules following the named framework             | 9 / 10 (10 / 10 after manual review)  |
| Sentences with a figure not in the input          | 290                                   |
| Judge: from input / labelled / **unsourced fact** | 44 / 218 / **28**                     |
| **Modules with zero unsourced facts**             | **2 / 10** (A/B design, user stories) |
| Outputs over the production 4,000-token cap       | **7 / 10**                            |

Unsourced facts per module:

| Module        | Count |
| ------------- | ----- |
| Market sizing | 13    |
| OKRs          | 4     |
| Risk register | 3     |
| North Star    | 2     |
| Positioning   | 2     |
| SWOT          | 2     |
| PRD           | 1     |
| JTBD          | 1     |
| A/B design    | 0     |
| User stories  | 0     |

## Misses, by failure category (first run)

1. **Invented metrics presented as fact: 28 sentences across 8 modules.** This is the main finding. The prompt itself invites it: "Add your expert analysis, identify gaps, and provide actionable recommendations beyond what was provided." Patterns:
   - **Invented market statistics with named outside sources** (market sizing, 13). Examples: a global market value with a growth rate attributed to research firms, staffing vacancy rates attributed to an association, comparable-vendor growth stories. None of these sources is in the input.
   - **Invented industry benchmarks** (OKRs, North Star, PRD). Examples: "Industry benchmark for SMB veterinary SaaS is 10–14% annual logo churn"; "Personalized reminders ... see 15–25% higher response rates"; an average visit value attributed to an association.
   - **Invented operational or legal figures** (risk register). A per-message regulatory penalty range, and a 15–25% volume spike.
   - **Invented derived claims** (SWOT). "Pawpath has penetrated roughly 1.4% of its addressable market", with no market size in the input.
   - **Borderline judge calls (2)**: the JTBD "first 30 days" and the positioning "works in 20 minutes" quote. Without them, 3 of 10 modules are clean.
2. **Length over the production cap: 7 modules.** Visible output was 4,217 to 14,766 tokens against `maxTokens: 4000`. In production these would be cut off, and the format puts "prioritized next steps" last, so that section is what gets lost. Two caveats apply:
   - Temperature and thinking differ on the CLI path, so this needs confirming on the API path.
   - Every checked section was present here because nothing was truncated.
3. **Rubric false negatives (SWOT, 2 checks).** Both were found by manual review:
   - The summary is a bold paragraph under an H2 subtitle, which the H1-to-first-H2 rule misses.
   - The "top 3 actions" are headed "Priority 1/2/3", not "top 3".

   The output meets both requirements. The regexes were left unchanged and the miss is reported.

No module failed to produce its named framework once formatting was handled.

## Before and after the fix

Round 1 fix (production code), in `src/lib/ai.ts`:

- **Figures rule**, added to the shared format rules of both `buildModulePrompt` and `buildAnalysisPrompt`: use only figures from the PM's input or figures clearly labelled as an assumption, estimate, target or placeholder; never cite outside sources, studies, surveys, analyst reports, market statistics or industry benchmarks the input did not provide; state a missing number as an assumption to validate.
- **Length budget**, same place: keep the document under about 1,800 words, cover every section briefly rather than dropping one, and always finish with the next steps. `maxTokens` stays at 4,000. Raising it is not safe across the selectable models: gpt-4-turbo allows at most 4,096 output tokens, so a higher cap would make that model fail outright.

Checks after the fix: `npm run typecheck` clean; `npm run lint` back to the upstream baseline of 0 errors and 55 warnings (the eval harness had added 45 errors; it is now kept out of the app lint run); `npm run build` succeeds. pm-os has no unit test suite.

**Rubric version.** Unchanged from the first run's final grading: `evals/rubric/fixtures.json` sha256 `8620d49e...b69efe` (recorded in both result files' summaries from this rerun on), plus the two formatting fixes already applied to the first run (bold stripped; user stories may wrap). Nothing was loosened for the rerun. Same 10 inputs, same generation model (`claude-sonnet-4-6`), same judge (`claude-opus-5-5`). Results: `evals/rubric/results/2026-10-15-claude-cli.json` (before), `evals/rubric/results/2026-10-15-claude-cli-after-fix.json` (round 1) and `evals/rubric/results/2026-10-15-claude-cli-round-2.json` (round 2). The round 2 summary records the same rubric sha256.

| Metric                                                      | Before            | Round 1         | Round 2         |
| ----------------------------------------------------------- | ----------------- | --------------- | --------------- |
| Required-section checks passed                              | 87 / 88           | 87 / 88         | 87 / 88         |
| Modules with every required section (regex)                 | 9 / 10            | 9 / 10          | 9 / 10          |
| Modules with every required section (after manual review)   | 10 / 10           | **9 / 10**      | **10 / 10**     |
| Framework checks passed                                     | 14 / 15           | 14 / 15         | 14 / 15         |
| Modules following the named framework (after manual review) | 10 / 10           | 10 / 10         | 10 / 10         |
| Sentences with a figure not in the input                    | 290               | 90              | 82              |
| Judge: from input / labelled / **unsourced fact**           | 44 / 218 / **28** | 14 / 74 / **2** | 15 / 65 / **2** |
| **Modules with zero unsourced facts**                       | **2 / 10**        | **8 / 10**      | **8 / 10**      |
| **Outputs over the production 4,000-token cap**             | **7 / 10**        | **0 / 10**      | **0 / 10**      |
| Visible output tokens, range                                | 3,241 to 14,766   | 2,179 to 2,865  | 2,123 to 2,852  |
| Generation latency p50 / p90                                | 188 s / 435 s     | 81 s / 160 s    | 81 s / 125 s    |
| Modules whose last H1 or H2 section is next steps           | 10 / 10           | 9 / 10          | 10 / 10         |

Remaining misses after round 1, all reported as found:

1. **SWOT has no next-steps section (real miss, new).** It ends after "Top 3 Prioritized Strategic Actions". The length budget may have pushed the model to stop there; the rule says to always finish with next steps, so this is a prompt-compliance miss. One case in ten.
2. **Unsourced facts (2 sentences).**
   - PRD: "Book a time in under 60 seconds without a phone call" stated as a user need with no label. Borderline: a design goal, not a statistic.
   - Market sizing: the summary calls the ~$3.0M 3-year capture "realistic" and "anchored entirely in CRM data", when it rests on an assumed 15% SOM rate the body does label.
3. **Rubric false negative (OKRs).** The three objectives are headed "OKR 1/2/3: ..." with key results under each, so the "at least 2 objectives" regex misses them. The regex was not changed; the miss is reported and adjusted by hand.

### Round 2

Root causes of the three round 1 misses, each traced to the prompt:

- **SWOT dropped next steps.** The SWOT module prompt ends with "Prioritize the top 3 strategic actions", and the shared rules only said "End with prioritized next steps". The model treated its top 3 actions as the prioritised ending. The length rule said to always finish with next steps but never named the section or listed what was required.
- **PRD user need "under 60 seconds".** The figures rule spoke of numbers and percentages, so a time limit inside a requirement did not read as a figure. The same PRD set a "<90 seconds" target elsewhere.
- **Market sizing summary.** The body labelled the 15% SOM rate as an assumption, but nothing asked for that label to travel with the figure when the summary repeated it. The module prompt also still asked for top-down sizing from "industry reports", which the figures rule forbids.

Fix (production prompts, same commit as these results):

- `src/lib/ai.ts`, the length and closing-section rules: list the required sections (executive summary, every section the framework asks for, a final "## Next Steps"), say to shorten other sections when running long and never drop a required one, and say Next Steps is always last and separate from any top actions the framework asks for. The about 1,800-word budget stays; `maxTokens` stays at 4,000.
- `src/lib/ai.ts`, `FIGURES_RULE`: the rule applies to user needs, requirements, the summary and next steps; a time limit, threshold or goal the model introduces is a target, labelled and consistent across the document; a repeated figure that rests on an assumption must say so in that sentence.
- `src/lib/ai-prompts.ts`, market sizing: top-down now starts from "figures the PM provided or explicitly stated assumptions" instead of "industry reports".

Checks: `npm run typecheck` clean; `npm run lint` 0 errors, 55 warnings (upstream baseline); `npm run build` succeeds. No unit test suite exists.

Round 2 result: all three targeted misses are gone. The PRD and market sizing have no unsourced facts, and every module now ends with "## Next Steps". The unsourced-fact count is still 2, from two different modules:

1. **OKRs (new).** "too short for a standard 13-week OKR cycle": an industry norm stated as fact. The 11 weeks it is compared with is computed from the date and counts as input.
2. **A/B design (new).** Clinic-level randomisation "would require ~545 clinics per arm (after applying a design effect of ~3.9)": a derived figure from an unstated intra-cluster correlation, with no assumption label. Borderline: it is a calculation, but its input is invented.

Rubric false negatives in round 2 (the regexes were not changed; adjusted by hand in the table):

- **JTBD executive summary.** The summary is a full paragraph, but it sits under an H2 subtitle ("## Jobs-to-be-Done Analysis ..."), the same pattern that tripped SWOT in the first run.
- **JTBD job statements.** All 10 statements follow "When ..., I want ..., so I can ...", but only 2 use "I want to"; the rest read "I want [a thing]", so the "I want to" regex counts 2 of the 3 it needs. The framework is followed; the canonical wording is not, in 8 of 10 statements.

One quality note outside the rubric: the JTBD summary ends with a meta sentence ("figures are drawn exclusively from the PM's inputs, with any additions clearly labelled"), which echoes the prompt rule into the deliverable. One case in ten; not fixed.

Also noticed on the first two runs: 4 of 10 outputs put an author line with the CLI's logged-in account name or email, which the CLI injects as context. That is a CLI-path artifact, not production behaviour; the strings are replaced with placeholders in both result files. In round 2 one output (PRD) did the same and is redacted the same way.

### Review follow-up and spot-check

After code review, the shared rules were scoped so they fit every module, not only the 10 graded ones:

- **Analysis path.** `buildAnalysisPrompt` has its own numbered structure (observations, gaps, recommendations, next actions) and works from the PM's own data. It keeps the figures rule, which now also allows figures "computed directly from" the input, and a plain length budget. It no longer gets the forced executive summary or `## Next Steps`.
- **Modules with their own structure.** A per-module opt-out list in `src/lib/ai.ts` covers modules whose prompt defines its own opening and ending, or whose output is user-facing: one-pager, API docs, daily and weekly plans, release notes, meeting notes, agenda, announcement, changelog and meeting templates. They get "follow the structure above, do not add an executive summary or next steps it does not ask for", plus the same length budget. The other modules, including all 10 graded ones, get the same prompt text as round 2 apart from the "computed directly from it" wording.

Spot-check of 5 modules outside the rubric set (`evals/rubric/harness/spot-check.ts`, results in `evals/rubric/results/2026-10-15-spot-check.json`). Each was generated once with the same CLI path and model, from fictional Pawpath inputs. This is n=1 per module and not graded by the rubric or the judge; it checks length and structure only.

| Module                         | Visible tokens | Ends with Next Steps | Structure                                                                                                  |
| ------------------------------ | -------------- | -------------------- | ---------------------------------------------------------------------------------------------------------- |
| API docs (opt-out)             | 3,238          | No                   | Overview, base URL, auth, endpoints, errors, rate limits, code examples, then a gaps table and a changelog |
| Release notes (opt-out)        | 1,422          | No                   | New, Improved, Fixed, Breaking Changes, then a gaps list for the PM and a feedback line                    |
| Meeting notes (opt-out)        | 901            | No                   | Attendees, agenda items, decisions, action items, parking lot, follow-up date: the module's own order      |
| Technical design (not opt-out) | 3,036          | Yes                  | Overview through rollout plan and monitoring, then Next Steps; a design doc for the team, so the tail fits |
| Assumption tracker analysis    | 2,441          | No                   | The analysis prompt's numbered 1 to 4 sections, then a short verdict                                       |

All 5 are under the 4,000-token cap, and none has a Next Steps tail where it does not belong. One structural issue remains: API docs and release notes still end with an "Expert Analysis / Identified Gaps" section. That comes from the shared user prompt ("Add your expert analysis, identify gaps ..."), which every module gets; it is useful to the PM but would need removing before the document is published. It is not fixed in this round. Separately, the release notes invent a support email address, which the figures rule does not cover. The technical design put the CLI account name in an author line, redacted as in the other result files.

## Latency and usage (first run)

|                                  | Calls | p50   | p90   | Max   |
| -------------------------------- | ----- | ----- | ----- | ----- |
| Generation (`claude-sonnet-4-6`) | 10    | 188 s | 435 s | 435 s |
| Judge (`claude-opus-5-5`)        | 10    | 20 s  | 47 s  | 47 s  |

- Wall time was 13 min at 3 concurrent.
- Usage reported by the CLI: about 38k input tokens and 120k output tokens, which includes thinking.
- 0 CLI errors.
- An earlier attempt of this run was stopped by a harness bug: the usage-limit detector matched "rate limit" inside a generated risk register. The bug was fixed and the run redone. That attempt's calls are not in the results.

## Reading the result

The first run found structure and framework adherence good enough to publish, but not the invented-metric rate or the length. Its two recommended fixes (a figures rule, and a length limit instead of a higher cap) are applied as described above, so the original recommendations are not repeated here.

Both fixes are applied, a second prompt round followed, and this eval has been rerun after each. Before quoting numbers: run the planned API rerun, where `maxTokens: 4000` and temperature actually apply, and watch whether the length budget costs the closing next steps more than once in ten.

## Reproduce

```sh
cd pm-os
evals/rubric/harness/setup-shims.sh                    # Sentry stub + standalone zod in ./node_modules (gitignored)
bun --no-install evals/rubric/harness/run.ts          # 20 CLI calls; writes evals/rubric/results/<date>-claude-cli.json
EVAL_TAG=after-fix bun --no-install evals/rubric/harness/run.ts   # same, written with an -after-fix suffix (round 2 used EVAL_TAG=round-2)
bun --no-install evals/rubric/harness/rescore.ts evals/rubric/results/<date>-claude-cli.json   # re-grade, no model
EVAL_ONLY=strategy/okrs bun --no-install evals/rubric/harness/run.ts                          # one module
bun --no-install evals/rubric/harness/spot-check.ts   # ungraded n=1 spot-check of 5 other modules
```

`setup-shims.sh` only writes the stub when no real `@sentry/nextjs` is installed and only adds zod when it is missing, so it is safe to run on a full `npm ci` install. To go back to a normal dev setup after using the shims, run `npm ci`.
