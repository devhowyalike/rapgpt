/**
 * Unified verse generation that routes to appropriate SDK based on provider
 */

import Anthropic from '@anthropic-ai/sdk';
import { anthropic as vercelAnthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import type { ModelConfig } from './model-config';

export interface VerseGenerationParams {
  systemPrompt: string;
  userMessage: string;
  model: ModelConfig;
}

export interface VerseGenerationResult {
  textStream: AsyncIterable<string>;
  getUsage: () => Promise<{
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cachedInputTokens: number;
  }>;
}

/**
 * Generate verse using Anthropic SDK with prompt caching
 */
async function generateWithAnthropicSDK(
  params: VerseGenerationParams
): Promise<VerseGenerationResult> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const stream = await client.messages.stream({
    model: params.model.modelName,
    max_tokens: params.model.maxTokens,
    temperature: params.model.temperature,
    // Enable prompt caching on system prompt
    system: [{
      type: "text",
      text: params.systemPrompt,
      cache_control: { type: "ephemeral" }
    }],
    messages: [{
      role: 'user',
      content: params.userMessage
    }]
  });

  // Convert Anthropic stream to common format
  const textStream = (async function* () {
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && 
          event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }
  })();

  const getUsage = async () => {
    const finalMessage = await stream.finalMessage();
    return {
      inputTokens: finalMessage.usage.input_tokens,
      outputTokens: finalMessage.usage.output_tokens,
      totalTokens: finalMessage.usage.input_tokens + finalMessage.usage.output_tokens,
      cachedInputTokens: finalMessage.usage.cache_read_input_tokens ?? 0,
    };
  };

  return { textStream, getUsage };
}

/**
 * Generate verse using Vercel AI SDK (works with any provider)
 */
async function generateWithVercelSDK(
  params: VerseGenerationParams
): Promise<VerseGenerationResult> {
  // Select the appropriate provider from Vercel SDK
  let model;
  switch (params.model.provider) {
    case 'anthropic':
      model = vercelAnthropic(params.model.modelName);
      break;
    case 'openai':
      model = openai(params.model.modelName);
      break;
    // Add more providers as needed
    default:
      throw new Error(`Unsupported provider: ${params.model.provider}`);
  }

  const result = streamText({
    model,
    system: params.systemPrompt,
    messages: [{
      role: 'user',
      content: params.userMessage,
    }],
    temperature: params.model.temperature,
    // Note: maxTokens is handled by the model provider configuration
  });

  // Convert to common format
  const textStream = result.textStream;

  const getUsage = async () => {
    // Wait for stream to complete and get usage
    const text = await result.text; // This waits for completion
    const usage = await result.usage;
    return {
      inputTokens: usage.inputTokens ?? 0,
      outputTokens: usage.outputTokens ?? 0,
      totalTokens: usage.totalTokens ?? 0,
      cachedInputTokens: usage.cachedInputTokens ?? 0, // Vercel SDK reports this for Anthropic models
    };
  };

  return { textStream, getUsage };
}

/**
 * Main entry point - automatically routes to correct SDK
 */
export async function generateVerse(
  params: VerseGenerationParams
): Promise<VerseGenerationResult> {
  // Use Anthropic SDK if it's an Anthropic model and supports caching
  if (params.model.provider === 'anthropic' && params.model.supportsCaching) {
    console.log('[Verse Generator] Using Anthropic SDK with prompt caching');
    return generateWithAnthropicSDK(params);
  }
  
  // Otherwise use Vercel AI SDK
  console.log(`[Verse Generator] Using Vercel AI SDK for ${params.model.provider}`);
  return generateWithVercelSDK(params);
}

