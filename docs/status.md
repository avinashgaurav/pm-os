# Roadmap, status and privacy

## Roadmap

Actively built. All 82 modules run locally once you configure your own provider key; the hosted demo has no key configured, so AI drafting does not work there. Polish, sync, and richer editing are planned as separate PRs.

- **[Open issues](https://github.com/avinashgaurav/pm-os/issues)**: the backlog (unit and E2E tests, UX and workflow audit, performance, accessibility, optional sync).
- **[Feature roadmap (#32)](https://github.com/avinashgaurav/pm-os/issues/32)**: 50 product ideas (rich editor, backlinks, AI coach, integrations, multi-workspace).

Contributions welcome. Start with issues labeled `priority:low` or `area:docs`.

## Status and limitations

- **Hosted demo needs a key.** The public deploy has no provider key, so Generate and Analyze fail there. Run locally with your own key to try the AI features.
- **No unit tests yet.** CI runs typecheck, lint, build and secret scanning only.
- **The AI endpoint has no auth or rate limit by default.** `/api/ai` accepts any request unless `PM_OS_API_TOKEN` is set, and the browser client does not send that token yet. Do not deploy publicly with a provider key until auth and rate limiting are added.
- **Prompt evals have not run yet.** The eval harness (`evals/`, `npm run eval`) and its nightly GitHub Actions job exist, but the job skips when no provider key secret is set, and none is set, so no snapshots have been produced.

## Privacy

Your data stays in your browser's IndexedDB. The only outbound request is the LLM call when you click _Generate_ or _Analyze_. Export everything anytime: **Settings → Export All Data**.
