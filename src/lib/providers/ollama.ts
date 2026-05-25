import type { ProviderModule } from './types';
import { lines } from './stream-utils';

function body(system: string, user: string, model: string, temperature: number, stream: boolean) {
  return JSON.stringify({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    stream,
    options: { temperature },
  });
}

export const ollama: ProviderModule = {
  id: 'ollama',
  label: 'Ollama (local)',
  models: ['llama3.1', 'llama3.2', 'mistral', 'qwen2.5'],
  defaultModel: 'llama3.1',
  envVar: 'OLLAMA_URL',
  docs: 'https://ollama.com/download',

  isConfigured: () => !!process.env.OLLAMA_URL,

  async generate({ system, user, model, temperature = 0.7, signal }) {
    const base = process.env.OLLAMA_URL;
    if (!base) throw new Error('Ollama not configured');
    const res = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: body(system, user, model, temperature, false),
    });

    if (!res.ok) throw new Error(`Ollama error: ${res.status}`);

    const data = await res.json();
    return data.message?.content ?? '';
  },

  async *generateStream({ system, user, model, temperature = 0.7, signal }) {
    const base = process.env.OLLAMA_URL;
    if (!base) throw new Error('Ollama not configured');
    const res = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: body(system, user, model, temperature, true),
    });

    if (!res.ok || !res.body) throw new Error(`Ollama error: ${res.status}`);

    // Ollama streams NDJSON: one JSON object per line, each with a `message`
    // shape. The terminating object carries `done: true` and no content delta.
    for await (const line of lines(res.body)) {
      const t = line.trim();
      if (!t) continue;
      try {
        const evt = JSON.parse(t) as { message?: { content?: string }; done?: boolean };
        const content = evt.message?.content;
        if (content) yield content;
        if (evt.done) break;
      } catch {
        // Skip malformed line.
      }
    }
  },
};
