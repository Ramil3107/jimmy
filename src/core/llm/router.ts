import OpenAI from 'openai';
import { env } from '../../config/env.js';
import { logger } from '../logger.js';
import { buildRouterPrompt } from './prompts/router.v1.js';
import type { IntentResult, RoutingContext } from './types.js';

let openai: OpenAI | null = null;

function getClient(): OpenAI {
  if (!openai) {
    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required for LLM routing');
    }
    openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return openai;
}

export async function routeMessage(
  text: string,
  context: RoutingContext,
): Promise<IntentResult> {
  const client = getClient();
  const systemPrompt = buildRouterPrompt(context);

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
  ];

  // Add recent conversation history
  for (const msg of context.recent_messages) {
    messages.push({ role: msg.role, content: msg.content });
  }

  // Add the current user message
  messages.push({ role: 'user', content: text });

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.3,
    max_tokens: 1024,
    response_format: { type: 'json_object' },
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    throw new Error('Empty response from LLM');
  }

  logger.debug({ raw }, 'LLM raw response');

  const parsed = JSON.parse(raw) as IntentResult;

  // Validate required fields
  if (!parsed.intent || typeof parsed.confidence !== 'number' || !parsed.response_text) {
    throw new Error(`Invalid LLM response structure: ${raw}`);
  }

  return {
    intent: parsed.intent,
    confidence: parsed.confidence,
    params: parsed.params || {},
    response_text: parsed.response_text,
    suggested_actions: parsed.suggested_actions,
  };
}
