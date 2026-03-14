import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BotContext } from '../context.js';
import type { User } from '../../features/users/user.types.js';

const mockRouteMessage = vi.hoisted(() => vi.fn());
const mockGetSkillByIntent = vi.hoisted(() => vi.fn());
const mockGetSkillDescriptions = vi.hoisted(() => vi.fn().mockReturnValue([]));

vi.mock('../../core/llm/index.js', () => ({
  routeMessage: mockRouteMessage,
}));

vi.mock('../../core/skills/registry.js', () => ({
  getSkillByIntent: mockGetSkillByIntent,
  getSkillDescriptions: mockGetSkillDescriptions,
}));

vi.mock('../../core/logger.js', () => ({
  logger: { debug: vi.fn(), error: vi.fn() },
}));

import { handleMessage } from './message.handler.js';

const baseUser: User = {
  id: 'uuid-123',
  telegram_id: 12345678,
  display_name: 'Test',
  language: 'en',
  timezone: 'UTC',
  onboarding_step: 7,
  onboarding_complete: true,
  digest_morning_time: '08:00',
  digest_evening_time: '21:00',
  last_active_at: null,
  created_at: '2026-03-14T00:00:00Z',
  updated_at: '2026-03-14T00:00:00Z',
};

function makeCtx(): BotContext {
  return {
    user: { ...baseUser },
    reply: vi.fn(),
    replyWithChatAction: vi.fn(),
  } as unknown as BotContext;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('handleMessage', () => {
  it('routes message and sends LLM response', async () => {
    mockRouteMessage.mockResolvedValue({
      intent: 'chat',
      confidence: 0.9,
      params: {},
      response_text: 'Hi there!',
    });
    mockGetSkillByIntent.mockReturnValue({
      name: 'chat',
      handler: vi.fn(),
    });

    const ctx = makeCtx();
    await handleMessage(ctx, 'hello');

    expect(mockRouteMessage).toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('Hi there!');
  });

  it('sends low confidence response when < 0.3', async () => {
    mockRouteMessage.mockResolvedValue({
      intent: 'unknown',
      confidence: 0.2,
      params: {},
      response_text: 'I did not understand.',
    });

    const ctx = makeCtx();
    await handleMessage(ctx, 'asdfghjkl');

    expect(ctx.reply).toHaveBeenCalledWith('I did not understand.');
  });

  it('executes help skill handler directly', async () => {
    const helpHandler = vi.fn();
    mockRouteMessage.mockResolvedValue({
      intent: 'help',
      confidence: 0.95,
      params: {},
      response_text: 'Here is help.',
    });
    mockGetSkillByIntent.mockReturnValue({
      name: 'help',
      handler: helpHandler,
    });

    const ctx = makeCtx();
    await handleMessage(ctx, 'help');

    expect(helpHandler).toHaveBeenCalled();
    // Help skill handles its own reply, so response_text is NOT sent
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it('handles routing errors gracefully', async () => {
    mockRouteMessage.mockRejectedValue(new Error('API down'));

    const ctx = makeCtx();
    await handleMessage(ctx, 'hello');

    expect(ctx.reply).toHaveBeenCalledWith('Something went wrong. Please try again.');
  });

  it('sends response even when skill not found', async () => {
    mockRouteMessage.mockResolvedValue({
      intent: 'unsupported',
      confidence: 0.8,
      params: {},
      response_text: "I can't do that yet.",
    });
    mockGetSkillByIntent.mockReturnValue(undefined);

    const ctx = makeCtx();
    await handleMessage(ctx, 'fly me to the moon');

    expect(ctx.reply).toHaveBeenCalledWith("I can't do that yet.");
  });
});
