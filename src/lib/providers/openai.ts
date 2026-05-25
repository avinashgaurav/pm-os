import type { ProviderModule } from './types';
import { sseData } from './stream-utils';

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
  });
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
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal,
      body: buildBody(system, user, model, temperature, maxTokens, false),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `OpenAI error: ${res.status}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? '';
  },

  async *generateStream({ system, user, model, temperature = 0.7, maxTokens = 4000, signal }) {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal,
      body: buildBody(system, user, model, temperature, maxTokens, true),
    });

    if (!res.ok || !res.body) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `OpenAI error: ${res.status}`);
    }

    for await (const payload of sseData(res.body)) {
      const delta = (payload as { choices?: { delta?: { content?: string } }[] }).choices?.[0]
        ?.delta?.content;
      if (delta) yield delta;
    }
  },
};
