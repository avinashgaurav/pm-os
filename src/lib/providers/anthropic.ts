import type { ProviderModule } from './types';
import { sseData } from './stream-utils';
import { fetchWithRetry } from './retry';
import { makeUsage } from './usage';

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
    const res = await fetchWithRetry(
      ENDPOINT,
      {
        method: 'POST',
        headers: headers(),
        body: buildBody(system, user, model, temperature, maxTokens, false),
      },
      { signal, provider: 'anthropic' }
    );
    const data = await res.json();
    const block = data.content?.[0];
    const text = block?.type === 'text' ? block.text : '';
    const usage = data.usage as { input_tokens?: number; output_tokens?: number } | undefined;
    return {
      text,
      usage: makeUsage('anthropic', model, usage?.input_tokens ?? 0, usage?.output_tokens ?? 0),
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
      { signal, provider: 'anthropic' }
    );
    if (!res.body) return;

    // Anthropic SSE: message_start carries input_tokens, content_block_delta
    // carries text, message_delta carries the running output_tokens count.
    let inputTokens = 0;
    let outputTokens = 0;
    for await (const payload of sseData(res.body)) {
      const evt = payload as {
        type?: string;
        delta?: { type?: string; text?: string };
        message?: { usage?: { input_tokens?: number } };
        usage?: { output_tokens?: number };
      };
      if (evt.type === 'message_start') {
        inputTokens = evt.message?.usage?.input_tokens ?? inputTokens;
      } else if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
        const text = evt.delta.text;
        if (text) yield { type: 'text', delta: text };
      } else if (evt.type === 'message_delta') {
        outputTokens = evt.usage?.output_tokens ?? outputTokens;
      }
    }
    yield { type: 'usage', usage: makeUsage('anthropic', model, inputTokens, outputTokens) };
  },
};
