import type { ProviderModule } from './types';
import { lines } from './stream-utils';
import { fetchWithRetry } from './retry';
import { AIError } from './errors';
import { makeUsage } from './usage';

// Ollama takes generation knobs through `options`. `num_predict` is the
// equivalent of max_tokens — currently omitted to mirror the rest of the
// providers' implicit defaults; pre-existing behaviour, not changed by this PR.
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
    if (!base) throw new AIError('auth', 'Ollama not configured', { provider: 'ollama' });
    const res = await fetchWithRetry(
      `${base}/api/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body(system, user, model, temperature, false),
      },
      { signal, provider: 'ollama' }
    );
    const data = await res.json();
    const text = data.message?.content ?? '';
    // Ollama returns prompt_eval_count + eval_count on the final response.
    const inputTokens = data.prompt_eval_count ?? 0;
    const outputTokens = data.eval_count ?? 0;
    return { text, usage: makeUsage('ollama', model, inputTokens, outputTokens) };
  },

  async *generateStream({ system, user, model, temperature = 0.7, signal }) {
    const base = process.env.OLLAMA_URL;
    if (!base) throw new AIError('auth', 'Ollama not configured', { provider: 'ollama' });
    const res = await fetchWithRetry(
      `${base}/api/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body(system, user, model, temperature, true),
      },
      { signal, provider: 'ollama' }
    );
    if (!res.body) return;

    let inputTokens = 0;
    let outputTokens = 0;
    // Ollama NDJSON: one JSON object per line, each with a `message` shape.
    // The terminating object carries `done: true` plus prompt_eval_count and
    // eval_count.
    for await (const line of lines(res.body)) {
      const t = line.trim();
      if (!t) continue;
      try {
        const evt = JSON.parse(t) as {
          message?: { content?: string };
          done?: boolean;
          prompt_eval_count?: number;
          eval_count?: number;
        };
        const content = evt.message?.content;
        if (content) yield { type: 'text', delta: content };
        if (evt.done) {
          inputTokens = evt.prompt_eval_count ?? inputTokens;
          outputTokens = evt.eval_count ?? outputTokens;
          break;
        }
      } catch {
        // Skip malformed line.
      }
    }
    yield { type: 'usage', usage: makeUsage('ollama', model, inputTokens, outputTokens) };
  },
};
