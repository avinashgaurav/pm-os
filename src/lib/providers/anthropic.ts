import type { ProviderModule } from './types';
import { sseData } from './stream-utils';

const ENDPOINT = 'https://api.anthropic.com/v1/messages';

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
    system,
    messages: [{ role: 'user', content: user }],
    max_tokens: maxTokens,
    temperature,
    stream,
  });
}

function headers() {
  return {
    'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
    'anthropic-version': '2023-06-01',
    'Content-Type': 'application/json',
  };
}

export const anthropic: ProviderModule = {
  id: 'anthropic',
  label: 'Anthropic',
  models: ['claude-sonnet-4-6', 'claude-opus-4-7', 'claude-haiku-4-5-20251001'],
  defaultModel: 'claude-sonnet-4-6',
  envVar: 'ANTHROPIC_API_KEY',
  docs: 'https://console.anthropic.com/settings/keys',

  isConfigured: () => !!process.env.ANTHROPIC_API_KEY,

  async generate({ system, user, model, temperature = 0.7, maxTokens = 4000, signal }) {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: headers(),
      signal,
      body: buildBody(system, user, model, temperature, maxTokens, false),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Anthropic error: ${res.status}`);
    }

    const data = await res.json();
    const block = data.content?.[0];
    return block?.type === 'text' ? block.text : '';
  },

  async *generateStream({ system, user, model, temperature = 0.7, maxTokens = 4000, signal }) {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: headers(),
      signal,
      body: buildBody(system, user, model, temperature, maxTokens, true),
    });

    if (!res.ok || !res.body) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Anthropic error: ${res.status}`);
    }

    // Anthropic SSE emits typed events: message_start, content_block_start,
    // content_block_delta (carries text deltas), content_block_stop,
    // message_delta, message_stop. We only need content_block_delta.
    for await (const payload of sseData(res.body)) {
      const evt = payload as { type?: string; delta?: { type?: string; text?: string } };
      if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
        const text = evt.delta.text;
        if (text) yield text;
      }
    }
  },
};
