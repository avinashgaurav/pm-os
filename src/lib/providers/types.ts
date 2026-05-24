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

export interface ProviderModule extends ProviderInfo {
  isConfigured: () => boolean;
  generate: (args: GenerateArgs) => Promise<string>;
}
