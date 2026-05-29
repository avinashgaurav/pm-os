# Contributing to PM OS

Thanks for your interest in PM OS. This is a fast-moving project, so a small
amount of upfront alignment saves everyone time.

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md).
By participating, you agree to uphold it.

## Quick start

```bash
nvm use            # picks up .nvmrc → Node 22
npm install
npm run dev        # http://localhost:3000
```

Run the full check suite before pushing:

```bash
npm run lint
npm run typecheck
npm run build
```

Husky pre-commit runs `lint-staged` and `gitleaks` automatically.

## Filing an issue

Use the appropriate template: **Bug report** for something broken, **Feature
request** for something new. Empty issues will be closed.

A good bug report names:

- the module slug (e.g. `analytics/funnel-builder`),
- what you expected,
- what actually happened (browser console + screenshots help),
- whether AI generation, Dexie storage, or routing is involved.

## Opening a pull request

1. Branch from `main` with a descriptive name (`feat/...`, `fix/...`, `chore/...`).
2. Keep PRs scoped — one logical change per PR. Bundle docs/templates if the
   change is genuinely one chore (this PR is the canonical example).
3. Run the check suite. CI runs Node 20 + 22 + secret scanning + prompt-eval
   snapshots — locally cover what you can.
4. Fill in the PR template (it's short on purpose).
5. PRs are reviewed by an independent `code-reviewer` pass before merge.
   Expect Blocker / Major / Minor / Nit findings. Blocker + Major are gating.

## Architectural ground rules

- **Local-first.** All user data lives in IndexedDB via Dexie. Never persist
  user content to a server.
- **API keys never reach the browser.** Provider keys live in server env, only
  `/api/ai/*` routes touch them.
- **Validate at trust boundaries.** Dexie reads and AI responses must round-trip
  through Zod schemas in `src/lib/schemas/`. Add `AssertEquals` drift guards
  when introducing a new schema/type pair.
- **Schemas migrate additively.** Bump Dexie versions; never remove fields in
  the same version that data is read in.
- **No surprise re-renders.** Hooks that subscribe to Dexie should consolidate
  live queries (see `useIsFirstVisit` for the pattern).
- **Streaming is the default.** Long AI outputs go through `generateStreamWithAI`,
  not `generateWithAI`.

## Style

- TypeScript everywhere. No `any` without a `// reason: ...` comment.
- Tailwind for styling. Lean on the surface ladder and `<StatusPill>` rather
  than ad-hoc badge color combos.
- Comments earn their keep — write _why_, not _what_. Don't reference issue
  numbers or PRs in code comments (they rot).

## Disclosure

If you find a security issue, do not file a public issue. Email the maintainer
or open a private security advisory on GitHub.
