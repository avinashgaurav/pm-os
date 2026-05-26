// Token usage + cost estimation shared across all providers.
//
// Each generate / generateStream call now reports a Usage envelope. Pricing
// is a published-rate snapshot — actual billing depends on the user's account
// tier and any volume discounts. The estimate is intentionally rough — the
// goal is "you used N tokens, about $X" trust signaling, not invoice-grade
// accuracy.

export interface Usage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  // Estimated cost in USD. May be 0 for unpriced models (Ollama local).
  estimatedCostUsd: number;
  provider: string;
  model: string;
}

// Per-model pricing in USD per million tokens (input, output). Sourced from
// the provider's public pricing page; update when models or prices change.
// Models not listed here fall through to a conservative zero estimate so the
// pill renders "—" instead of misleading numbers.
const PRICING: Record<string, { in: number; out: number }> = {
  // Groq — https://groq.com/pricing
  'llama-3.3-70b-versatile': { in: 0.59, out: 0.79 },
  'llama-3.1-8b-instant': { in: 0.05, out: 0.08 },
  'mixtral-8x7b-32768': { in: 0.24, out: 0.24 },

  // OpenAI — https://openai.com/api/pricing
  'gpt-4o': { in: 2.5, out: 10.0 },
  'gpt-4o-mini': { in: 0.15, out: 0.6 },
  'gpt-4-turbo': { in: 10.0, out: 30.0 },

  // Anthropic — https://www.anthropic.com/pricing
  'claude-opus-4-7': { in: 15.0, out: 75.0 },
  'claude-sonnet-4-6': { in: 3.0, out: 15.0 },
  'claude-haiku-4-5-20251001': { in: 0.8, out: 4.0 },

  // Google — https://ai.google.dev/pricing
  'gemini-1.5-pro': { in: 1.25, out: 5.0 },
  'gemini-1.5-flash': { in: 0.075, out: 0.3 },
  'gemini-2.0-flash-exp': { in: 0.0, out: 0.0 },

  // Ollama — runs locally, no per-token cost.
};

export function priceTokens(model: string, input: number, output: number): number {
  const rate = PRICING[model];
  if (!rate) return 0;
  return (input * rate.in + output * rate.out) / 1_000_000;
}

export function makeUsage(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number
): Usage {
  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    estimatedCostUsd: priceTokens(model, inputTokens, outputTokens),
    provider,
    model,
  };
}

// Format a Usage as a short pill string: "1,234 tokens · ~$0.012"
export function formatUsage(u: Usage): string {
  const tokens = u.totalTokens.toLocaleString();
  if (u.estimatedCostUsd === 0) return `${tokens} tokens`;
  const cost = u.estimatedCostUsd < 0.01 ? '<$0.01' : `~$${u.estimatedCostUsd.toFixed(3)}`;
  return `${tokens} tokens · ${cost}`;
}
