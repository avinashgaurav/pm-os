import type { ProviderModule } from './types';
import { sseData } from './stream-utils';
import { fetchWithRetry } from './retry';
import { makeUsage } from './usage';

const ENDPOINT = 'https://api.openai.com/v1/chat/completions';

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
    ...(stream ? { stream_options: { include_usage: true } } : {}),
  });
}

function headers() {
  return {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

export const openai: ProviderModule = {
  id: 'openai',
  label: 'OpenAI',
  models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
  defaultModel: 'gpt-4o-mini',
  envVar: 'OPENAI_API_KEY',
  docs: 'https://platform.openai.com/api-keys',

  isConfigured: () => !!process.env.OPENAI_API_KEY,

  async generate({ system, user, model, temperature = 0.7, maxTokens = 4000, signal }) {
    const res = await fetchWithRetry(
      ENDPOINT,
      {
        method: 'POST',
        headers: headers(),
        body: buildBody(system, user, model, temperature, maxTokens, false),
      },
      { signal, provider: 'openai' }
    );
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? '';
    const usage = data.usage as { prompt_tokens?: number; completion_tokens?: number } | undefined;
    return {
      text,
      usage: makeUsage('openai', model, usage?.prompt_tokens ?? 0, usage?.completion_tokens ?? 0),
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
      { signal, provider: 'openai' }
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
      if (p.usage) {
        inputTokens = p.usage.prompt_tokens ?? inputTokens;
        outputTokens = p.usage.completion_tokens ?? outputTokens;
      }
    }
    yield { type: 'usage', usage: makeUsage('openai', model, inputTokens, outputTokens) };
  },
};
