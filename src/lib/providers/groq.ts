import type { ProviderModule } from './types';
import { sseData } from './stream-utils';
import { fetchWithRetry } from './retry';

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
    return data.choices?.[0]?.message?.content ?? '';
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
    for await (const payload of sseData(res.body)) {
      const delta = (payload as { choices?: { delta?: { content?: string } }[] }).choices?.[0]
        ?.delta?.content;
      if (delta) yield delta;
    }
  },
};
