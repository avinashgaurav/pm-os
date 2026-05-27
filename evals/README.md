# Prompt regression evals

Guardrail for `src/lib/ai-prompts.ts`. Changing a prompt should produce a clear
before/after diff in the PR — not a silent quality regression on adjacent
modules.

## Layout

```
evals/
  fixtures/   <category>__<moduleSlug>.json   { title, sections: [{ label, value }] }
  snapshots/  <category>__<moduleSlug>.md     committed model output
```

## Run

```bash
npm run eval                    # refresh all snapshots
npm run eval -- --only specs/prd
npm run eval:check              # CI mode: fail on drift
```

Requires at least one provider env: `GROQ_API_KEY`, `OPENAI_API_KEY`,
`ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, or `OLLAMA_URL`. Picks the first
configured provider in a fixed order (Groq → OpenAI → Anthropic → Gemini →
Ollama) so snapshots don't drift just because a different key happens to be
set in CI.

## When a snapshot drifts

1. CI fails the PR with a clear list of drifted modules.
2. Review the diff: is the change deliberate (you tweaked a prompt) or
   unintended (an adjacent change silently degraded this module)?
3. If deliberate: `npm run eval`, commit the updated snapshots, push.
4. If not: revert the prompt change.

## Adding a new fixture

Drop a JSON file at `evals/fixtures/<category>__<moduleSlug>.json` matching
the schema above. Run `npm run eval` — the harness will create the matching
snapshot. Commit both.

## Out of scope (follow-ups)

- LLM-as-judge scoring (0-10 quality grades on top of the snapshot diff)
- Cost budget per eval run
- Parallelism (current harness is sequential to keep rate-limit pressure low)
