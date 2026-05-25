import type { ProviderModule } from './types';
import { sseData } from './stream-utils';

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
  });
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
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal,
      body: buildBody(system, user, model, temperature, maxTokens, false),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Groq error: ${res.status}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? '';
  },

  async *generateStream({ system, user, model, temperature = 0.7, maxTokens = 4000, signal }) {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal,
      body: buildBody(system, user, model, temperature, maxTokens, true),
    });

    if (!res.ok || !res.body) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Groq error: ${res.status}`);
    }

    for await (const payload of sseData(res.body)) {
      const delta = (payload as { choices?: { delta?: { content?: string } }[] }).choices?.[0]
        ?.delta?.content;
      if (delta) yield delta;
    }
  },
};
