# pm-os document quality test

This is a first test of the documents pm-os writes, graded against a scoring checklist. The code under test is `buildModulePrompt` in `src/lib/ai.ts`, plus each module's own prompt in `src/lib/ai-prompts.ts`. I ran it on 2026-10-15. I then ran it twice more the same day: once after a first prompt fix (round 1) and once after a second prompt fix (round 2). See "Before and after the fix".

**How it was run.** I sent the app's own prompts and output format through the Claude Code CLI (Anthropic's command-line tool), not through the API path the live app uses. A rerun through the API is planned.

## Why I did not use the existing `eval-prompts` check

`scripts/eval-prompts.ts` and `.github/workflows/eval-prompts.yml` only check whether output changed from a saved copy. They do not judge quality:

- They save one output per test input and fail when the next output is different.
- No saved copy is committed (`evals/snapshots/` holds only `.gitkeep`), and there is no scoring checklist.
- They need a provider API key, and they try Groq first.
- The 5 test inputs in `evals/fixtures/` name real outside brands.

So this test does not use them. It is a separate test, scored with a checklist, in `evals/rubric/`. It calls the same app code that `eval-prompts.ts` calls: `buildModulePrompt`, `getModule` and `getOutputName`. The existing check is left as it was.

How the test script runs (`evals/rubric/harness/run.ts`):

- **Writing the documents.** Each module prompt is sent to `claude -p` with these flags: `--system-prompt` set to the app's system prompt, `--tools ""`, `--strict-mcp-config`, `--setting-sources ""`, `--no-session-persistence` and `--model claude-sonnet-4-6`. That model is the Anthropic provider's `defaultModel` in the app. There is no `--json-schema` flag, because the app asks for plain markdown, not a fixed data format.
- **Libraries loaded at start.** `ai.ts` loads `@sentry/nextjs` and `zod` as soon as it is imported. `setup-shims.sh` puts a do-nothing Sentry stand-in and a standalone copy of zod in the gitignored `node_modules`. This avoids a full `npm ci`.

How this differs from the live app's API path:

- **No temperature or `max_tokens`.** The live app sends `temperature`, a randomness setting (0.7 by default, 0 in `eval-prompts.ts`), and `maxTokens: 4000`. The CLI sends neither.
- **The CLI turned on extended thinking**, where the model reasons before it answers. Those thinking tokens are left out of the counts below.
- **No `--bare`.** That flag needs `ANTHROPIC_API_KEY`, and this run used a plan login instead.

## Test inputs

10 made-up module inputs about a made-up product: Pawpath, appointment software for independent vet clinics, from the made-up company Fernway Labs. File: `evals/rubric/fixtures.json`.

Modules tested: PRD, OKRs, Jobs-to-be-Done, risk register, North Star, positioning (Dunford), A/B test design, user stories, SWOT, and market sizing.

I wrote down the required sections and framework markers for each module before the run. They come from that module's own system prompt and the shared format rules (summary first, prioritised next steps last).

## What was checked

1. **Required sections (fixed text-pattern checks, same result every time).** 88 checks in total: 3 shared by every module (H1 title, executive summary, next steps) plus each module's own list. For example, the A/B module needs a hypothesis, primary metric, guardrails, MDE (the smallest change the test can detect), sample size, duration, randomisation unit, analysis plan and pitfalls.
2. **Named framework followed (same kind of fixed text-pattern checks).** 15 checks. Examples:
   - JTBD needs 3 or more "When ..., I want to ..., so I can ..." statements.
   - OKRs need 2 or more objectives, 6 or more key results (KRs), and at least 80% of KRs with a number.
   - SWOT needs SO, WO, ST and WT strategies.
   - Market sizing needs both top-down and bottom-up.
   - A/B design needs an If/then/because hypothesis.
3. **No made-up metrics presented as facts.**
   - **Step one, done by code.** Code pulls out every sentence or table row that has a metric-like figure (%, money, multiplier, magnitude, or a count with a unit) whose number is not in the input.
   - **Step two, another AI grading the answers** (`claude-opus-5-5`, one CLI call per module, answers in a fixed JSON format). The grader labels each pulled-out sentence as one of:
     - `INPUT`: repeated from the input, or worked out from it
     - `LABELLED`: clearly marked as a target, assumption, estimate or example
     - `UNSOURCED_FACT`: stated as fact with nothing to back it

     The grader judges how a figure is presented, not whether it sounds plausible.

4. **Length.** Visible output tokens (the word pieces the reader sees), compared with the live app's limit of `maxTokens: 4000`.

I made two fixes to the test script after the run. Both are formatting fixes. I applied them by re-grading the saved outputs with `rescore.ts`, with no new model calls:

- Bold markers are removed before matching, because "**When** ... **I want to**" split the phrase.
- User stories may run across more than one line.

Both are recorded in the results file.

## Results (first run, before the fix)

| What was measured                                      | Result                                   |
| ------------------------------------------------------ | ---------------------------------------- |
| Modules written                                        | 10 / 10                                  |
| Required-section checks passed                         | 87 / 88                                  |
| Modules with every required section                    | 9 / 10 (10 / 10 after I checked by hand) |
| Framework checks passed                                | 14 / 15                                  |
| Modules following the named framework                  | 9 / 10 (10 / 10 after I checked by hand) |
| Sentences with a figure not in the input               | 290                                      |
| AI grader: from input / labelled / **fact, no source** | 44 / 218 / **28**                        |
| **Modules with no unsourced facts**                    | **2 / 10** (A/B design, user stories)    |
| Outputs longer than the live app's 4,000-token limit   | **7 / 10**                               |

Unsourced facts in each module:

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

## What went wrong, by type (first run)

1. **Made-up metrics presented as fact: 28 sentences across 8 modules.** This is the main finding. The prompt itself invites it: "Add your expert analysis, identify gaps, and provide actionable recommendations beyond what was provided." The patterns:
   - **Made-up market statistics credited to named outside sources** (market sizing, 13). Examples: a global market value with a growth rate credited to research firms, staffing vacancy rates credited to an association, and growth stories of similar vendors. None of these sources is in the input.
   - **Made-up industry benchmarks** (OKRs, North Star, PRD). Examples: "Industry benchmark for SMB veterinary SaaS is 10–14% annual logo churn"; "Personalized reminders ... see 15–25% higher response rates"; an average visit value credited to an association.
   - **Made-up operational or legal figures** (risk register). A range of regulatory fines per message, and a 15–25% jump in volume.
   - **Made-up derived claims** (SWOT). "Pawpath has penetrated roughly 1.4% of its addressable market", with no market size in the input.
   - **Close calls by the grader (2)**: the JTBD "first 30 days" and the positioning "works in 20 minutes" quote. Without them, 3 of 10 modules are clean.
2. **Too long for the live app's limit: 7 modules.** Visible output was 4,217 to 14,766 tokens, against `maxTokens: 4000`. The live app would cut these off. The format puts "prioritized next steps" last, so that is the section that would be lost. Two limits apply:
   - The CLI path handles temperature and thinking differently, so this needs to be confirmed on the API path.
   - Every checked section was present here only because nothing was cut off.
3. **The checklist marked a pass as a fail (SWOT, 2 checks).** I found both by checking by hand:
   - The summary is a bold paragraph under an H2 subtitle. The check looks for it between the H1 and the first H2, so it missed it.
   - The "top 3 actions" are headed "Priority 1/2/3", not "top 3".

   The output meets both requirements. I left the checks unchanged and report the miss.

Once formatting was handled, every module followed its named framework.

## Before and after the fix

Round 1 fix, made in the live app code in `src/lib/ai.ts`:

- **Figures rule**, added to the shared format rules of both `buildModulePrompt` and `buildAnalysisPrompt`. It says: use only figures from the PM's input, or figures clearly labelled as an assumption, estimate, target or placeholder. Never cite outside sources, studies, surveys, analyst reports, market statistics or industry benchmarks the input did not give. If a number is missing, state it as an assumption to check.
- **Length budget**, added in the same place: keep the document under about 1,800 words, cover every section briefly rather than dropping one, and always finish with the next steps. `maxTokens` stays at 4,000. Raising it is not safe for every model a user can pick: gpt-4-turbo allows at most 4,096 output tokens, so a higher limit would make that model fail outright.

Checks after the fix: `npm run typecheck` passes with no errors. `npm run lint` is back to the original project's level of 0 errors and 55 warnings (the test script had added 45 errors; it is now kept out of the app's lint run). `npm run build` succeeds. pm-os has no unit tests.

**Checklist version.** The same as the first run's final grading: `evals/rubric/fixtures.json` sha256 `8620d49e...b69efe` (a fingerprint of the file, recorded in both result files' summaries from this rerun on), plus the two formatting fixes already applied to the first run (bold removed; user stories may run across lines). Nothing was made easier for the rerun. Same 10 inputs, same writing model (`claude-sonnet-4-6`), same AI grader (`claude-opus-5-5`). Results: `evals/rubric/results/2026-10-15-claude-cli.json` (before), `evals/rubric/results/2026-10-15-claude-cli-after-fix.json` (round 1) and `evals/rubric/results/2026-10-15-claude-cli-round-2.json` (round 2). The round 2 summary records the same checklist sha256 fingerprint.

| What was measured                                              | Before fixes      | After round 1   | After round 2   |
| -------------------------------------------------------------- | ----------------- | --------------- | --------------- |
| Required-section checks passed                                 | 87 / 88           | 87 / 88         | 87 / 88         |
| Modules with every required section (automatic check)          | 9 / 10            | 9 / 10          | 9 / 10          |
| Modules with every required section (after checking by hand)   | 10 / 10           | **9 / 10**      | **10 / 10**     |
| Framework checks passed                                        | 14 / 15           | 14 / 15         | 14 / 15         |
| Modules following the named framework (after checking by hand) | 10 / 10           | 10 / 10         | 10 / 10         |
| Sentences with a figure not in the input                       | 290               | 90              | 82              |
| AI grader: from input / labelled / **fact, no source**         | 44 / 218 / **28** | 14 / 74 / **2** | 15 / 65 / **2** |
| **Modules with no unsourced facts**                            | **2 / 10**        | **8 / 10**      | **8 / 10**      |
| **Outputs longer than the live app's 4,000-token limit**       | **7 / 10**        | **0 / 10**      | **0 / 10**      |
| Visible output tokens, shortest to longest                     | 3,241 to 14,766   | 2,179 to 2,865  | 2,123 to 2,852  |
| Time to write one document, median (p50) / near slowest (p90)  | 188 s / 435 s     | 81 s / 160 s    | 81 s / 125 s    |
| Modules whose last H1 or H2 heading is next steps              | 10 / 10           | 9 / 10          | 10 / 10         |

Problems left after round 1, all reported as found:

1. **SWOT has no next-steps section (a real miss, new).** It ends after "Top 3 Prioritized Strategic Actions". The length budget may have pushed the model to stop there. The rule says to always finish with next steps, so the model did not follow the prompt. One case in ten.
2. **Unsourced facts (2 sentences).**
   - PRD: "Book a time in under 60 seconds without a phone call" is stated as a user need with no label. A close call: it is a design goal, not a statistic.
   - Market sizing: the summary calls the ~$3.0M 3-year capture "realistic" and "anchored entirely in CRM data". But it rests on an assumed 15% SOM rate (the share of the market Pawpath can realistically win), which the body does label.
3. **The checklist marked a pass as a fail (OKRs).** The three objectives are headed "OKR 1/2/3: ..." with key results under each, so the "at least 2 objectives" check misses them. I did not change the check; I report the miss and corrected the count by hand.

### Round 2

Why the three round 1 problems happened. Each one traced back to the prompt:

- **SWOT dropped next steps.** The SWOT module prompt ends with "Prioritize the top 3 strategic actions". The shared rules only said "End with prioritized next steps". So the model treated its top 3 actions as the prioritised ending. The length rule said to always finish with next steps, but it never named the section or listed what was required.
- **PRD user need "under 60 seconds".** The figures rule talked about numbers and percentages. So a time limit inside a requirement did not read as a figure. The same PRD set a "<90 seconds" target elsewhere.
- **Market sizing summary.** The body labelled the 15% SOM rate as an assumption. But nothing asked for that label to stay with the figure when the summary repeated it. The module prompt also still asked for top-down sizing from "industry reports", which the figures rule forbids.

Fix (live app prompts, in the same commit as these results):

- `src/lib/ai.ts`, the length and closing-section rules: they now list the required sections (executive summary, every section the framework asks for, a final "## Next Steps"). They say to shorten other sections when running long and never drop a required one. They say Next Steps always comes last and is separate from any top actions the framework asks for. The budget of about 1,800 words stays; `maxTokens` stays at 4,000.
- `src/lib/ai.ts`, `FIGURES_RULE`: the rule now covers user needs, requirements, the summary and next steps. A time limit, threshold or goal the model adds is a target: it must be labelled and stay the same across the document. A repeated figure that rests on an assumption must say so in that sentence.
- `src/lib/ai-prompts.ts`, market sizing: top-down sizing now starts from "figures the PM provided or explicitly stated assumptions" instead of "industry reports".

Checks: `npm run typecheck` passes with no errors. `npm run lint` shows 0 errors and 55 warnings (the original project's level). `npm run build` succeeds. There are no unit tests.

Round 2 result: all three problems it targeted are gone. The PRD and market sizing have no unsourced facts, and every module now ends with "## Next Steps". There are still 2 unsourced facts, now in two other modules:

1. **OKRs (new).** "too short for a standard 13-week OKR cycle": an industry norm stated as fact. The 11 weeks it is compared with is worked out from the date, so it counts as input.
2. **A/B design (new).** Clinic-level randomisation "would require ~545 clinics per arm (after applying a design effect of ~3.9)". This figure comes from a statistical assumption (intra-cluster correlation) that is never stated, and it has no assumption label. A close call: it is a calculation, but its input is made up.

Places where the checklist marked a pass as a fail in round 2 (I did not change the checks; I corrected the table by hand):

- **JTBD executive summary.** The summary is a full paragraph, but it sits under an H2 subtitle ("## Jobs-to-be-Done Analysis ..."). This is the same pattern that tripped SWOT in the first run.
- **JTBD job statements.** All 10 statements follow "When ..., I want ..., so I can ...". But only 2 use "I want to"; the rest read "I want [a thing]". So the "I want to" check counts 2 of the 3 it needs. The framework is followed, but the standard wording is not, in 8 of 10 statements.

One quality note outside the checklist: the JTBD summary ends with a sentence about the rules ("figures are drawn exclusively from the PM's inputs, with any additions clearly labelled"). It repeats the prompt's rule inside the document. One case in ten; not fixed.

Also seen on the first two runs: 4 of 10 outputs added an author line with the CLI's logged-in account name or email. The CLI adds that as background context. It is a side effect of the CLI path, not something the live app does. I replaced those strings with placeholders in both result files. In round 2 one output (PRD) did the same, and it is hidden the same way.

### Code review follow-up and spot-check

After code review, I narrowed the shared rules so they fit every module, not only the 10 graded ones:

- **Analysis path.** `buildAnalysisPrompt` has its own numbered structure (observations, gaps, recommendations, next actions) and works from the PM's own data. It keeps the figures rule, which now also allows figures "computed directly from" the input, plus a simple length budget. It no longer gets the forced executive summary or `## Next Steps`.
- **Modules with their own structure.** A per-module opt-out list in `src/lib/ai.ts` covers modules whose prompt sets its own opening and ending, or whose output is read by end users: one-pager, API docs, daily and weekly plans, release notes, meeting notes, agenda, announcement, changelog and meeting templates. They get "follow the structure above, do not add an executive summary or next steps it does not ask for", plus the same length budget. The other modules, including all 10 graded ones, get the same prompt text as round 2, except for the "computed directly from it" wording.

I also spot-checked 5 modules outside the graded set (`evals/rubric/harness/spot-check.ts`, results in `evals/rubric/results/2026-10-15-spot-check.json`). Each was written once, through the same CLI path and model, from made-up Pawpath inputs. That is n=1 (a single try) per module. Neither the checklist nor the AI grader scored them; this checks length and structure only.

| Module                         | Visible tokens | Ends with Next Steps | Structure                                                                                                           |
| ------------------------------ | -------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| API docs (opt-out)             | 3,238          | No                   | Overview, base URL, auth, endpoints, errors, rate limits, code examples, then a gaps table and a changelog          |
| Release notes (opt-out)        | 1,422          | No                   | New, Improved, Fixed, Breaking Changes, then a gaps list for the PM and a feedback line                             |
| Meeting notes (opt-out)        | 901            | No                   | Attendees, agenda items, decisions, action items, parking lot, follow-up date: the module's own order               |
| Technical design (not opt-out) | 3,036          | Yes                  | Overview through rollout plan and monitoring, then Next Steps. It is a design doc for the team, so that ending fits |
| Assumption tracker analysis    | 2,441          | No                   | The analysis prompt's numbered 1 to 4 sections, then a short verdict                                                |

All 5 are under the 4,000-token limit, and none ends with Next Steps where it does not belong. One structure problem remains: API docs and release notes still end with an "Expert Analysis / Identified Gaps" section. It comes from the shared user prompt ("Add your expert analysis, identify gaps ..."), which every module gets. That section helps the PM, but it would need removing before the document is published. It is not fixed in this round. Separately, the release notes make up a support email address, which the figures rule does not cover. The technical design put the CLI account name in an author line; I hid it, as in the other result files.

## Speed and usage (first run)

|                               | Calls | p50 (median) | p90 (near slowest) | Slowest |
| ----------------------------- | ----- | ------------ | ------------------ | ------- |
| Writing (`claude-sonnet-4-6`) | 10    | 188 s        | 435 s              | 435 s   |
| AI grader (`claude-opus-5-5`) | 10    | 20 s         | 47 s               | 47 s    |

- The whole run took 13 min, with 3 calls at a time.
- Usage reported by the CLI: about 38k input tokens and 120k output tokens, including thinking.
- 0 CLI errors.
- An earlier try at this run stopped because of a bug in the test script: the check for usage limits matched the words "rate limit" inside a generated risk register. I fixed the bug and redid the run. Calls from that try are not in the results.

## What the results mean

The first run showed that structure and framework use were good enough to publish. The rate of made-up metrics and the length were not. Its two suggested fixes (a figures rule, and a length limit instead of a higher token limit) are applied as described above, so I do not repeat them here.

Both fixes are in, a second round of prompt fixes followed, and I reran this test after each. Before quoting these numbers, run the planned API rerun, where `maxTokens: 4000` and temperature really apply. Also watch whether the length budget causes the closing next steps to be dropped more than once in ten.

## Run it yourself

```sh
cd pm-os
evals/rubric/harness/setup-shims.sh                    # Sentry stub + standalone zod in ./node_modules (gitignored)
bun --no-install evals/rubric/harness/run.ts          # 20 CLI calls; writes evals/rubric/results/<date>-claude-cli.json
EVAL_TAG=after-fix bun --no-install evals/rubric/harness/run.ts   # same, written with an -after-fix suffix (round 2 used EVAL_TAG=round-2)
bun --no-install evals/rubric/harness/rescore.ts evals/rubric/results/<date>-claude-cli.json   # re-grade, no model
EVAL_ONLY=strategy/okrs bun --no-install evals/rubric/harness/run.ts                          # one module
bun --no-install evals/rubric/harness/spot-check.ts   # ungraded n=1 spot-check of 5 other modules
```

`setup-shims.sh` only writes the stand-in when no real `@sentry/nextjs` is installed, and only adds zod when it is missing. So it is safe to run on a full `npm ci` install. To go back to a normal dev setup after using the shims, run `npm ci`.
