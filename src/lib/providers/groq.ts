import type { ProviderModule } from './types';
import { sseData } from './stream-utils';
import { fetchWithRetry } from './retry';
import { makeUsage } from './usage';

const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

function buildBody(
  system: string,
  user: string,
  model: string,
  temperature: number,
  maxTokens: number,
  stream: boolean
) {
  return JSON.stringify({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    max_tokens: maxTokens,
    temperature,
    stream,
    // Ask the streaming endpoint to emit a final usage event.
    ...(stream ? { stream_options: { include_usage: true } } : {}),
  });
}

function headers() {
  return {
    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

export const groq: ProviderModule = {
  id: 'groq',
  label: 'Groq',
  models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
  defaultModel: 'llama-3.3-70b-versatile',
  envVar: 'GROQ_API_KEY',
  docs: 'https://console.groq.com/keys',

  isConfigured: () => !!process.env.GROQ_API_KEY,

  async generate({ system, user, model, temperature = 0.7, maxTokens = 4000, signal }) {
    const res = await fetchWithRetry(
      ENDPOINT,
      {
        method: 'POST',
        headers: headers(),
        body: buildBody(system, user, model, temperature, maxTokens, false),
      },
      { signal, provider: 'groq' }
    );
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? '';
    const usage = data.usage as { prompt_tokens?: number; completion_tokens?: number } | undefined;
    return {
      text,
      usage: makeUsage('groq', model, usage?.prompt_tokens ?? 0, usage?.completion_tokens ?? 0),
    };
  },

  async *generateStream({ system, user, model, temperature = 0.7, maxTokens = 4000, signal }) {
    const res = await fetchWithRetry(
      ENDPOINT,
      {
        method: 'POST',
        headers: headers(),
        body: buildBody(system, user, model, temperature, maxTokens, true),
      },
      { signal, provider: 'groq' }
    );
    if (!res.body) return;

    let inputTokens = 0;
    let outputTokens = 0;
    for await (const payload of sseData(res.body)) {
      const p = payload as {
        choices?: { delta?: { content?: string } }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      const delta = p.choices?.[0]?.delta?.content;
      if (delta) yield { type: 'text', delta };
      // Groq emits usage on the final event with an empty choices array.
      if (p.usage) {
        inputTokens = p.usage.prompt_tokens ?? inputTokens;
        outputTokens = p.usage.completion_tokens ?? outputTokens;
      }
    }
    yield { type: 'usage', usage: makeUsage('groq', model, inputTokens, outputTokens) };
  },
};
