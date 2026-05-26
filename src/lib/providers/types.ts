import type { Usage } from './usage';

export type ProviderId = 'groq' | 'openai' | 'anthropic' | 'gemini' | 'ollama';

export interface GenerateArgs {
  system: string;
  user: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface ProviderInfo {
  id: ProviderId;
  label: string;
  models: string[];
  defaultModel: string;
  envVar: string;
  docs: string;
}

export interface GenerateResult {
  text: string;
  usage: Usage;
}

// Stream events: most are text deltas (`{ type: 'text', delta: '...' }`); the
// final one is the usage envelope (`{ type: 'usage', usage: {...} }`). Routes
// distinguish them and forward usage separately from the text body.
export type StreamDelta = { type: 'text'; delta: string } | { type: 'usage'; usage: Usage };

export interface ProviderModule extends ProviderInfo {
  isConfigured: () => boolean;
  generate: (args: GenerateArgs) => Promise<GenerateResult>;
  // Optional streaming variant: yields incremental text deltas, then a final
  // usage event. Providers that omit this fall back to the non-streaming path.
  generateStream?: (args: GenerateArgs) => AsyncIterable<StreamDelta>;
}
