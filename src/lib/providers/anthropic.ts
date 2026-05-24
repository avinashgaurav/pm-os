import type { ProviderModule } from './types';

const URL = 'https://api.anthropic.com/v1/messages';

export const anthropic: ProviderModule = {
  id: 'anthropic',
  label: 'Anthropic',
  models: ['claude-sonnet-4-6', 'claude-opus-4-7', 'claude-haiku-4-5-20251001'],
  defaultModel: 'claude-sonnet-4-6',
  envVar: 'ANTHROPIC_API_KEY',
  docs: 'https://console.anthropic.com/settings/keys',

  isConfigured: () => !!process.env.ANTHROPIC_API_KEY,

  async generate({ system, user, model, temperature = 0.7, maxTokens = 4000, signal }) {
    const res = await fetch(URL, {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      signal,
      body: JSON.stringify({
        model,
        system,
        messages: [{ role: 'user', content: user }],
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Anthropic error: ${res.status}`);
    }

    const data = await res.json();
    const block = data.content?.[0];
    return block?.type === 'text' ? block.text : '';
  },
};
