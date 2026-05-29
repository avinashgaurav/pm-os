# Changelog

All notable changes to PM OS are recorded here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Full Dexie export + import with Zod validation across all 20 tables — corrupt
  rows are dropped with structured logging, unknown table keys reported (#12).
- Centralized data-io module (`src/lib/data-io.ts`) with versioned envelope.
- UX & workflow audit document (`docs/ux-workflow-audit.md`), strategy behind
  epic #68 (#72, PR #73).
- "What's next" doc-to-doc flow suggestions across all 82 modules (#50, #68).
- Cold-start wizard with tailored module recommendations (#48).
- Recents + frequents in the ⌘K command palette and a "Pick up where you left
  off" row on home (#49).
- Token + estimated cost pill in the AI output panel (#17).
- Retry + backoff + classified error handling in the AI client (#18).
- Streaming AI generation via ReadableStream with an abortable Stop button
  (#15).
- Zod schemas at the AI + Dexie boundaries with drift guards (#14).
- Prompt regression eval harness with nightly GH Actions run (#16).
- Ferrari premium PDF export theme alongside the default minimalist theme
  (#45).
- xAI bold-display landings + ElevenLabs AI generation moments (#44).
- Surface ladder (Raycast-style) replaces glass-card across all module
  surfaces (#47).

### Changed

- Brand favicon — Next.js boilerplate `favicon.ico` replaced with the PM mark
  (PRs #69 and #71 — modern SVG + legacy `.ico` fallback for Safari / caches).
- Per-module visual audit: status badges migrated to `<StatusPill>`,
  `bg-primary/10 text-primary` white-on-white risk replaced (#46).
- Dexie schema bumped to v3 — added `preferences` (v2) and `moduleVisits` (v3)
  tables additively (no data migration).

### Fixed

- FOUC on theme reload — inline script applies theme class before hydration
  (#43).

## [0.1.0] - 2026-04-01

Project bootstrapped: 82 PM module templates across 10 disciplines, AI
generation through 5 providers (Groq / OpenAI / Anthropic / Gemini / Ollama),
local-first storage in IndexedDB via Dexie, Sentry observability, Husky
pre-commit hooks, gitleaks secret scanning, CI on Node 20 + 22.

[Unreleased]: https://github.com/avinashgaurav/pm-os/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/avinashgaurav/pm-os/releases/tag/v0.1.0
