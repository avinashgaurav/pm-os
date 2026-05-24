import { groq } from './groq';
import { openai } from './openai';
import { anthropic } from './anthropic';
import { gemini } from './gemini';
import { ollama } from './ollama';
import type { ProviderId, ProviderModule } from './types';

const registry: Record<ProviderId, ProviderModule> = {
  groq,
  openai,
  anthropic,
  gemini,
  ollama,
};

export function getProvider(id: ProviderId): ProviderModule {
  const p = registry[id];
  if (!p) throw new Error(`Unknown provider: ${id}`);
  return p;
}

export function listProviders(): ProviderModule[] {
  return Object.values(registry);
}

export function isValidProviderId(id: string): id is ProviderId {
  return id in registry;
}

export type { ProviderId, ProviderModule } from './types';
