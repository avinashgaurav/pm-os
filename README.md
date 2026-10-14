<div align="center">

# pm-os

**The Product Management Operating System**

82 PM modules across 10 disciplines (strategy, discovery, specs, planning, launch, ops, growth, comms, analytics, competitive), 81 with AI drafting. Local-first, keyboard-driven.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8)](https://tailwindcss.com)

</div>

---

## What it does

pm-os is a single-user, local-first workspace for the documents PMs otherwise scatter across Notion, Linear, Miro and Google Docs. It has no collaboration or sync, so it complements those tools rather than replacing them for a team.

There are 82 PM modules. 57 are guided document forms that share one drafting flow: you fill in a few fields and a module-specific LLM prompt turns them into a draft artifact (a PRD, an OKR set, a persona, a release plan, and so on). 24 are custom trackers and canvases (backlog, risk register, story map, OST, and others) with an AI Analyze button. One (the knowledge base) is static reference content with no AI call. 81 module prompts live in `src/lib/ai-prompts.ts`.

Everything lives in your browser (IndexedDB). The only thing that leaves your machine is the LLM call when you click _Generate_ or _Analyze_. Switch LLM providers (**Groq, OpenAI, Anthropic, Gemini, or local Ollama**) without touching code.

### Why AI here, why code there

| Step | Done by | Why |
|---|---|---|
| Drafting a PRD, OKR set, persona or other document from your inputs, and analyzing a tracker | The model, on your own provider key | Turning rough notes into a structured first draft is the part a model is good at. 81 of the 82 modules have a prompt. |
| Forms, trackers, canvases, storage, export and the knowledge base | Code | Your data should behave the same every time and never leave the browser unless you click Generate or Analyze. |
| Which provider runs, and where the key lives | Code (server-side `/api/ai` route) | Keys stay in env vars, never in the browser bundle. |

The model writes first drafts for you to edit; nothing checks them for accuracy. See [Status and limitations](#status-and-limitations).

---

## The 10 disciplines

```mermaid
mindmap
  root((pm-os))
    Strategy
      OKRs
      Positioning
      GTM
      SWOT
      OST
      Pricing
    Discovery
      Interviews
      Personas
      JTBD
      Journey map
      Feedback
      Assumptions
    Specs
      PRD
      One-pager
      User stories
      Tech spec
      API docs
      Story map
    Planning
      Roadmap
      Backlog
      Sprints
      Quarterly
      Daily
    Launch
      Readiness
      Announcement
      Changelog
      Sales enablement
    Operations
      Retros
      Post-mortems
      CS playbook
      Meeting templates
    Growth
      Competency
      Hypothesis board
      Knowledge base
    Communication
      Exec update
      Board deck
      Decision doc
      Release notes
    Analytics
      Metrics
      Dashboards
      Funnels
      A/B design
      Experiments
    Competitive
      Landscape
      Profiles
      Win-loss
      Impact-effort
```

Many module prompts name the framework PMs already use (April Dunford for positioning, Teresa Torres for opportunity trees, Cooper for personas, Christensen for jobs-to-be-done).

---

## Quickstart

```bash
git clone https://github.com/avinashgaurav/pm-os.git
cd pm-os
npm install
cp .env.example .env.local
```

Edit `.env.local` and set **any one** provider key:

```bash
GROQ_API_KEY=gsk_...           # free tier — https://console.groq.com/keys
OPENAI_API_KEY=sk-...          # https://platform.openai.com/api-keys
ANTHROPIC_API_KEY=sk-ant-...   # https://console.anthropic.com/settings/keys
GOOGLE_API_KEY=...             # https://aistudio.google.com/apikey
OLLAMA_URL=http://localhost:11434  # if running Ollama locally
```

Then run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → **Settings** → pick a provider + model → start generating. Providers without a key are greyed out.

---

## Architecture

```mermaid
flowchart LR
    U[Browser] -->|reads + writes| D[(IndexedDB)]
    U -->|POST /api/ai| S[Next.js route]
    S -->|env-side key| P[Groq / OpenAI / Anthropic / Gemini / Ollama]
    P --> S --> U
```

- **Frontend:** Next.js 16, React 19, Tailwind 4, shadcn/ui, Base UI, Framer Motion, Recharts.
- **State:** Zustand for UI, Dexie/IndexedDB for everything persistent.
- **AI:** thin client → server-side `/api/ai` route → provider gateway. Keys live in env vars, never in the browser bundle.

Adding a provider is one file in `src/lib/providers/` plus its id in `src/lib/providers/types.ts` and a registry entry in `src/lib/providers/index.ts`. Adding a module is one route under `src/app/<category>/<slug>/page.tsx` + a prompt entry in `src/lib/ai-prompts.ts`. An architecture deep-dive is tracked in [#29](https://github.com/avinashgaurav/pm-os/issues/29).

---

## Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/avinashgaurav/pm-os)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/avinashgaurav/pm-os)

Set provider env vars in the host UI. For self-hosting, any Node host that runs Next.js works — `npm run build && npm start`.

---

## Roadmap

Actively built. All 82 modules run locally once you configure your own provider key; the hosted demo has no key configured, so AI drafting does not work there. Polish, sync, and richer editing are planned as separate PRs.

- **[Open issues](https://github.com/avinashgaurav/pm-os/issues)**: the backlog (unit and E2E tests, UX and workflow audit, performance, accessibility, optional sync).
- **[Feature roadmap (#32)](https://github.com/avinashgaurav/pm-os/issues/32)**: 50 product ideas (rich editor, backlinks, AI coach, integrations, multi-workspace).

Contributions welcome. Start with issues labeled `priority:low` or `area:docs`.

---

## Status and limitations

- **Hosted demo needs a key.** The public deploy has no provider key, so Generate and Analyze fail there. Run locally with your own key to try the AI features.
- **No unit tests yet.** CI runs typecheck, lint, build and secret scanning only.
- **The AI endpoint has no auth or rate limit by default.** `/api/ai` accepts any request unless `PM_OS_API_TOKEN` is set, and the browser client does not send that token yet. Do not deploy publicly with a provider key until auth and rate limiting are added.
- **Prompt evals have not run yet.** The eval harness (`evals/`, `npm run eval`) and its nightly GitHub Actions job exist, but the job skips when no provider key secret is set, and none is set, so no snapshots have been produced.

---

## Privacy

Your data stays in your browser's IndexedDB. The only outbound request is the LLM call when you click _Generate_ or _Analyze_. Export everything anytime: **Settings → Export All Data**.

---

## License

MIT — see [LICENSE](LICENSE). Built by [@avinashgaurav](https://github.com/avinashgaurav).
