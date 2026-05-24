import type { ProviderModule } from './types';

const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

export const groq: ProviderModule = {
  id: 'groq',
  label: 'Groq',
  models: [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'mixtral-8x7b-32768',
  ],
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
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Groq error: ${res.status}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? '';
  },
};
