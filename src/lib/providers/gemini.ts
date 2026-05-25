import type { ProviderModule } from './types';
import { sseData } from './stream-utils';
import { fetchWithRetry } from './retry';

function body(system: string, user: string, temperature: number, maxTokens: number) {
  return JSON.stringify({
    system_instruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: { temperature, maxOutputTokens: maxTokens },
  });
}

function headers() {
  return {
    'Content-Type': 'application/json',
    'x-goog-api-key': process.env.GOOGLE_API_KEY ?? '',
  };
}

export const gemini: ProviderModule = {
  id: 'gemini',
  label: 'Google Gemini',
  models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash-exp'],
  defaultModel: 'gemini-1.5-flash',
  envVar: 'GOOGLE_API_KEY',
  docs: 'https://aistudio.google.com/apikey',

  isConfigured: () => !!process.env.GOOGLE_API_KEY,

  async generate({ system, user, model, temperature = 0.7, maxTokens = 4000, signal }) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const res = await fetchWithRetry(
      url,
      { method: 'POST', headers: headers(), body: body(system, user, temperature, maxTokens) },
      { signal, provider: 'gemini' }
    );
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  },

  async *generateStream({ system, user, model, temperature = 0.7, maxTokens = 4000, signal }) {
    // `alt=sse` switches Gemini's streamGenerateContent to SSE framing.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`;
    const res = await fetchWithRetry(
      url,
      { method: 'POST', headers: headers(), body: body(system, user, temperature, maxTokens) },
      { signal, provider: 'gemini' }
    );
    if (!res.body) return;

    for await (const payload of sseData(res.body)) {
      const text = (
        payload as {
          candidates?: { content?: { parts?: { text?: string }[] } }[];
        }
      ).candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) yield text;
    }
  },
};
