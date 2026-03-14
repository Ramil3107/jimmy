import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RoutingContext } from './types.js';

const mockCreate = vi.hoisted(() => vi.fn());

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  })),
}));

vi.mock('../../config/env.js', () => ({
  env: { OPENAI_API_KEY: 'test-key' },
}));

vi.mock('../logger.js', () => ({
  logger: { debug: vi.fn(), error: vi.fn() },
}));

import { routeMessage } from './router.js';

const baseContext: RoutingContext = {
  user_name: 'Test',
  language: 'en',
  timezone: 'UTC',
  current_time: '2026-03-14T12:00:00Z',
  available_skills: [
    {
      name: 'chat',
      intents: ['chat'],
      description: 'General conversation',
      examples: ['hello', 'how are you'],
    },
  ],
  recent_messages: [],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('routeMessage', () => {
  it('returns parsed intent result', async () => {
    const llmResponse = {
      intent: 'chat',
      confidence: 0.95,
      params: {},
      response_text: 'Hello! How can I help?',
    };

    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(llmResponse) } }],
    });

    const result = await routeMessage('hello', baseContext);

    expect(result.intent).toBe('chat');
    expect(result.confidence).toBe(0.95);
    expect(result.response_text).toBe('Hello! How can I help?');
  });

  it('includes recent messages in context', async () => {
    const context: RoutingContext = {
      ...baseContext,
      recent_messages: [
        { role: 'user', content: 'hi' },
        { role: 'assistant', content: 'hello!' },
      ],
    };

    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            intent: 'chat',
            confidence: 0.9,
            params: {},
            response_text: 'How can I help?',
          }),
        },
      }],
    });

    await routeMessage('whats up', context);

    const callArgs = mockCreate.mock.calls[0][0];
    // system + 2 history + 1 current = 4 messages
    expect(callArgs.messages).toHaveLength(4);
  });

  it('throws on empty response', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: null } }],
    });

    await expect(routeMessage('hello', baseContext)).rejects.toThrow('Empty response from LLM');
  });

  it('throws on invalid JSON structure', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '{"foo": "bar"}' } }],
    });

    await expect(routeMessage('hello', baseContext)).rejects.toThrow('Invalid LLM response structure');
  });

  it('throws on malformed JSON', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'not json at all' } }],
    });

    await expect(routeMessage('hello', baseContext)).rejects.toThrow();
  });
});
