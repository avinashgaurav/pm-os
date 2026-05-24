import type { ProviderModule } from './types';

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
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        stream: false,
        options: { temperature },
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama error: ${res.status}`);
    }

    const data = await res.json();
    return data.message?.content ?? '';
  },
};
