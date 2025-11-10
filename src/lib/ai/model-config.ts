/**
 * AI Model Configuration
 * Centralized configuration for switching between AI providers
 */

export interface ModelConfig {
  provider: 'anthropic' | 'openai' | 'groq' | 'google';
  modelName: string;
  supportsCaching: boolean;
  temperature: number;
  maxTokens: number;
}

// Available model configurations
export const MODEL_CONFIGS = {
  // Anthropic models (support caching)
  'claude-3-5-haiku': {
    provider: 'anthropic' as const,
    modelName: 'claude-3-5-haiku-20241022',
    supportsCaching: true,
    temperature: 0.9,
    maxTokens: 1024,
  },
  'claude-3-5-sonnet': {
    provider: 'anthropic' as const,
    modelName: 'claude-3-5-sonnet-20241022',
    supportsCaching: true,
    temperature: 0.9,
    maxTokens: 1024,
  },
  
  // OpenAI models (no caching)
  'gpt-4o': {
    provider: 'openai' as const,
    modelName: 'gpt-4o',
    supportsCaching: false,
    temperature: 0.9,
    maxTokens: 1024,
  },
  'gpt-4o-mini': {
    provider: 'openai' as const,
    modelName: 'gpt-4o-mini',
    supportsCaching: false,
    temperature: 0.9,
    maxTokens: 1024,
  },
  
  // Add more providers as needed
  // 'llama-3-70b': {
  //   provider: 'groq' as const,
  //   modelName: 'llama-3-70b-8192',
  //   supportsCaching: false,
  //   temperature: 0.9,
  //   maxTokens: 1024,
  // },
} as const;

export type ModelConfigKey = keyof typeof MODEL_CONFIGS;

// Change this to switch models globally
// Or use environment variable: AI_MODEL=claude-3-5-haiku
export const ACTIVE_MODEL: ModelConfigKey = 
  (process.env.AI_MODEL as ModelConfigKey) || 'claude-3-5-haiku';

export function getActiveModelConfig(): ModelConfig {
  return MODEL_CONFIGS[ACTIVE_MODEL];
}

