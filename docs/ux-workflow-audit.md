# PM OS — UX & workflow audit

Findings and recommendations from working in the codebase across the AI + UX
tracks. Ordered by impact. Each section links to the structural change, why
it matters, and what to ship.

This is the strategy document behind epic [#68](https://github.com/avinashgaurav/pm-os/issues/68).
The "what's next" flow map for all 82 modules (the first half-A acceptance
line) is already shipped via #70. The deeper structural work in half-B is
what this doc lays out.

---

## 1. The shell still treats every module the same — biggest single problem

Every one of 82 modules renders through `DocumentEditor`: a list of saved
docs, an input form, a generated output. But `constants.ts` already tags
modules as `document` / `canvas` / `tracker`. Today the **archetype is
metadata, not behaviour**. A tracker (Backlog, Risk Register, Hypothesis
Board) is squeezed into "fill the form → Generate" that doesn't fit how
PMs use it. A canvas (Journey Map, SWOT, Vision Board, Metric Tree) is
even more mismatched.

**Highest-leverage change**: split `DocumentEditor` into three siblings —
`DocumentFlow`, `CanvasFlow`, `TrackerFlow` — each with its own
interaction model:

- **DocumentFlow** — close to today: structured form → stream → markdown
  output → export. The ~50 doc modules use this.
- **CanvasFlow** — opens directly into a 2-D workspace (already half-built
  per `metric-tree`, `journey-map`, `dependencies`, `vision-board`).
  Generation is "fill this canvas," not "produce a markdown blob."
- **TrackerFlow** — opens directly into a list/board/table with inline
  add. Generation is "AI Analyze" / "AI Prioritize," not "produce a doc."

This single split fixes ~30 of the 82 modules immediately and makes "AI
Analyze" the consistent primary action for trackers/canvases.

---

## 2. The doc lifecycle is half-modeled

A PM document goes through **prompt → draft → critique → revise → ship →
link forward**. PM OS models only the first arc and the last (link
forward, via #50). The middle is a black box:

- No way to ask the AI to **critique** a draft against best practice (this
  exists as "AI Analyze" but bolted on inconsistently).
- No **revise with feedback** — you re-fill the form and regenerate,
  losing diff visibility.
- No **versioning** — every save overwrites `_output`. A returning user
  has lost their prior draft.

**Recommendation**: per-doc revision history (Dexie rows keyed by docId).
Standardize three buttons on every doc output:

- **Critique** — AI runs an opinionated rubric on the current output
- **Revise** — text box → AI applies focused edits, diffs are visible
- **Branch** — fork to a new revision for A/B

---

## 3. Information architecture is sound but density is wrong

10 disciplines × ~8 modules avg is the right shape; the problem is **flat
presentation**. Sidebar shows every category, home grid shows every
category. There's no "I work on launches this quarter" lens. The
cold-start wizard (#48) was a first step but only affects "Recommended
for you" — the main grid stays maximal.

**Recommendation**: add a **lens / workspace switcher** in the topbar
(Discovery / Strategy / Build / Launch / Operate). Picking a lens
collapses the sidebar to that workstream's 8–12 modules and turns the
home grid into a workflow board for that phase. The user can switch
lenses any time. Everything else stays accessible via ⌘K. This is what
#51 (multi-doc workspace) and #52 (IA audit) gesture at — combine them.

---

## 4. The AI moment is consistent but the "after-AI" UX is thin

Streaming, Stop, token pill, retry — all in great shape after the AI
track. What's still thin:

- **No structured output** — the model returns markdown blobs. Tables,
  scorecards, bullet groups all look the same. For 30+ modules a
  structured form-back-into-Dexie would be more useful than raw markdown.
- **No save-state hygiene** — typing in the input form doesn't autosave;
  reload loses everything until you generate. Draft-save on Generate-Save
  covers some of it but only after generation.
- **No comparison** — you can't see "what did 70b give me vs 8b" side
  by side.

**Recommendation**: declare a `ModuleSchema` per module — the structured
fields the AI should return (e.g. for RICE: `reach, impact, confidence,
effort, score, justification`). The markdown becomes a _view_ over that
schema, not the storage. The Zod work in #14 is the foundation.

---

## 5. Per-82-module workflow improvements

Concrete patterns the per-module audit (epic #68 half-B) should hit:

| Pattern                             | Modules affected                                                                                                                                                      | What to do                                                                                    |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Tracker-but-rendered-as-doc**     | backlog, risk-register, decisions, hypothesis-board, release-calendar, okr-tracker, team-health, competency, knowledge-base, feedback-wall, assumptions, scoring (12) | Reshape to `TrackerFlow` — list/table view with inline add, AI Analyze as primary action      |
| **Canvas-but-rendered-as-doc**      | journey-map, story-map, swot, bcg-matrix, ost, metric-tree, vision-board, stakeholder-map, dependencies, landscape, impact-effort (11)                                | Reshape to `CanvasFlow` — open directly into 2-D workspace, AI helps populate quadrants/nodes |
| **Sequential staged generation**    | prd, tech-spec, board-deck, api-docs                                                                                                                                  | Generate by section with inline review between sections, not one giant blob                   |
| **Iterative with user input loops** | interviews → synthesis → personas                                                                                                                                     | Encourage the chain via #50 flows + auto-carry-over of data, not just title                   |
| **Duplicate or thin**               | brief vs one-pager vs prd; agenda vs meeting-templates; daily vs weekly; processes vs cs-playbook                                                                     | Merge or differentiate clearly — they overlap ~60% in prompt + form                           |
| **Trivially small**                 | changelog, retro, post-mortem (1–2 fields each)                                                                                                                       | Keep but promote to "quick capture" — single textarea + AI-structure, not multi-section form  |

Sequence: ~10 PRs, each tackling 1 discipline's reshape decisions,
behind a `ModuleArchetype` switch.

---

## 6. Cross-module data is invisible

Docs from different modules don't reference each other. A PRD doesn't
know its parent strategy doc; a risk register doesn't link to the
project plan it belongs to. The `?from=` prefill from #50 is the only
existing link.

**Recommendation**: a lightweight **`linkedDocumentIds`** field on every
saved doc (already on `Decision`). The editor surfaces "Linked from: X"

- "Linked to: Y, Z" on each doc. AI prompts get this context
  automatically (e.g. "Here is the parent PRD when generating user
  stories"). This unlocks real workflows.

---

## 7. Quick wins not in any open issue

- **Autosave input forms** to Dexie on debounced typing (currently lost
  on reload)
- **Keyboard shortcut to regenerate** (`⌘↩` while in the form) — power
  users
- **"Pin to top" per module** in the sidebar — #54 is filed but unstarted;
  single-PR win
- **Inline edit of saved doc title** — currently requires opening the doc
- **Search inside saved docs** — palette searches modules; nothing
  searches _your content_
- **Export discipline-wide bundle** — "export all my strategy docs as a
  1-pager set" — important for handoffs

---

## Recommended sequencing

| Order | Change                                                               | Why first / later                                                                    |
| ----- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 1     | `ModuleArchetype` split (DocumentFlow / CanvasFlow / TrackerFlow)    | Biggest leverage. Unblocks 23 module reshapes. Structural — everything else benefits |
| 2     | Doc lifecycle: Critique / Revise / Branch buttons + revision history | Feels like a different product. High user-perceived value                            |
| 3     | Lens / workspace switcher in topbar                                  | Reduces overload more than any single other change                                   |
| 4     | Autosave + content search                                            | Quality-of-life that prevents user-data losses                                       |
| 5     | `linkedDocumentIds` carry-over                                       | Enables real cross-module workflows                                                  |
| 6     | Per-discipline reshape PRs (10 PRs)                                  | Gradual rollout of #1 plus prompt/form refinements                                   |

---

## Effort estimates

Engineer-days, assuming the author is already familiar with the codebase
(true for this session) and one PR per change. CI-approval friction not
included.

| #   | Change                                                                                        | Est. days                          |
| --- | --------------------------------------------------------------------------------------------- | ---------------------------------- |
| 1   | `ModuleArchetype` split — three flow components + dispatch + migrate `DocumentEditor` callers | 4–6                                |
| 2   | Doc lifecycle (Critique / Revise / Branch + revision Dexie table + diff view)                 | 5–7                                |
| 3   | Lens / workspace switcher (topbar + filtered sidebar + filtered home + state in localStorage) | 2–3                                |
| 4   | Autosave (debounced) + content search (Dexie full-text on doc titles + `_output`)             | 2–3                                |
| 5   | `linkedDocumentIds` field + UI surface + auto-context-into-prompt                             | 2–3                                |
| 6   | Per-discipline reshape (10 disciplines, 2–4 modules each)                                     | 8–12 total (≈1 day per discipline) |

**Total**: roughly **23–34 engineer-days** for the full programme. The
first change alone (the archetype split) is **4–6 days** and is what
makes every later change land cleanly.

### What this PR (the doc itself) takes

This PR adds the doc, raises the tracking issue, and links them. **≈30
minutes** of effort end-to-end, including review-ready CI.

---

## Out of scope (for this doc)

- The full implementation of any of the recommendations above —
  surfaced as separate issues / PRs once we agree on sequencing
- AI doc-to-doc transforms (epic [#32](https://github.com/avinashgaurav/pm-os/issues/32) item 14) — orthogonal to the
  shell/workflow rethink
- Performance / a11y / perf budgets — separate tracks
