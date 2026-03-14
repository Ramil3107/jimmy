import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BotContext } from '../../bot/context.js';
import type { User } from '../users/user.types.js';

const mockUpdateUser = vi.hoisted(() => vi.fn());

vi.mock('../users/user.repo.js', () => ({
  updateUser: mockUpdateUser,
}));

vi.mock('../../core/logger.js', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

vi.mock('./timezone-resolver.js', () => ({
  resolveTimezone: vi.fn(),
  mockResolveTimezone: vi.fn().mockReturnValue({ timezone: null, display: null }),
}));

vi.mock('../../config/env.js', () => ({
  env: { MOCK_LLM: true },
}));

import {
  handleOnboarding,
  handleOnboardingText,
  handleLanguageCallback,
  handleNameInput,
  handleTimezoneCallback,
  handleDigestCallback,
} from './onboarding.handler.js';

const baseUser: User = {
  id: 'uuid-123',
  telegram_id: 12345678,
  display_name: null,
  language: 'en',
  timezone: 'UTC',
  onboarding_step: 0,
  onboarding_complete: false,
  digest_morning_time: '08:00',
  digest_evening_time: '21:00',
  last_active_at: null,
  created_at: '2026-03-14T00:00:00Z',
  updated_at: '2026-03-14T00:00:00Z',
};

function makeCtx(step: number, text?: string): BotContext {
  return {
    user: { ...baseUser, onboarding_step: step },
    message: text ? { text } : undefined,
    reply: vi.fn(),
    replyWithChatAction: vi.fn(),
    answerCallbackQuery: vi.fn(),
    editMessageText: vi.fn(),
  } as unknown as BotContext;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdateUser.mockResolvedValue(baseUser);
});

describe('handleOnboarding', () => {
  it('step 0: sends welcome, sets English, and advances to name prompt', async () => {
    const ctx = makeCtx(0);

    await handleOnboarding(ctx);

    // Welcome message + name prompt = 2 replies
    expect(ctx.reply).toHaveBeenCalledTimes(2);
    expect(mockUpdateUser).toHaveBeenCalledWith('uuid-123', { language: 'en', onboarding_step: 2 });
  });

  it('step 1: skips language, sets English, advances to name', async () => {
    const ctx = makeCtx(1);

    await handleOnboarding(ctx);

    expect(mockUpdateUser).toHaveBeenCalledWith('uuid-123', { language: 'en', onboarding_step: 2 });
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('call you'));
  });

  it('step 2: asks for name', async () => {
    const ctx = makeCtx(2);

    await handleOnboarding(ctx);

    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('call you'));
  });

  it('step 3: shows timezone keyboard', async () => {
    const ctx = makeCtx(3);

    await handleOnboarding(ctx);

    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining('Where are you located'),
    );
  });
});

describe('handleLanguageCallback', () => {
  it('saves language and advances to name step', async () => {
    const ctx = makeCtx(1);

    await handleLanguageCallback(ctx, 'ru');

    expect(mockUpdateUser).toHaveBeenCalledWith('uuid-123', { language: 'ru', onboarding_step: 2 });
    expect(ctx.answerCallbackQuery).toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('call you'));
  });

  it('handles "other" by asking for text input', async () => {
    const ctx = makeCtx(1);

    await handleLanguageCallback(ctx, 'other');

    expect(mockUpdateUser).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('type your preferred language'));
  });
});

describe('handleNameInput', () => {
  it('saves name and advances to timezone step', async () => {
    const ctx = makeCtx(2);

    await handleNameInput(ctx, 'Ramil');

    expect(mockUpdateUser).toHaveBeenCalledWith('uuid-123', { display_name: 'Ramil', onboarding_step: 3 });
    expect(ctx.reply).toHaveBeenCalledTimes(2); // "Nice to meet you" + timezone prompt
  });

  it('rejects empty name', async () => {
    const ctx = makeCtx(2);

    await handleNameInput(ctx, '   ');

    expect(mockUpdateUser).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('1-100 characters'));
  });
});

describe('handleTimezoneCallback', () => {
  it('saves timezone and advances to digest morning', async () => {
    const ctx = makeCtx(3);

    await handleTimezoneCallback(ctx, 'Asia/Baku');

    expect(mockUpdateUser).toHaveBeenCalledWith('uuid-123', { timezone: 'Asia/Baku', onboarding_step: 4 });
    expect(ctx.answerCallbackQuery).toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining('morning digest'),
      expect.anything(),
    );
  });
});

describe('handleDigestCallback', () => {
  it('morning: saves time and advances to evening', async () => {
    const ctx = makeCtx(4);

    await handleDigestCallback(ctx, 'morning', '08:00');

    expect(mockUpdateUser).toHaveBeenCalledWith('uuid-123', {
      digest_morning_time: '08:00',
      onboarding_step: 5,
    });
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining('evening digest'),
      expect.anything(),
    );
  });

  it('morning: skip works', async () => {
    const ctx = makeCtx(4);

    await handleDigestCallback(ctx, 'morning', 'skip');

    expect(mockUpdateUser).toHaveBeenCalledWith('uuid-123', {
      digest_morning_time: undefined,
      onboarding_step: 5,
    });
  });

  it('evening: saves time and completes onboarding', async () => {
    const ctx = makeCtx(5);
    ctx.user.display_name = 'Ramil';

    await handleDigestCallback(ctx, 'evening', '21:00');

    expect(mockUpdateUser).toHaveBeenCalledTimes(2); // digest update + onboarding complete
    expect(mockUpdateUser).toHaveBeenCalledWith('uuid-123', {
      digest_evening_time: '21:00',
      onboarding_step: 6,
    });
    expect(mockUpdateUser).toHaveBeenCalledWith('uuid-123', {
      onboarding_complete: true,
      onboarding_step: 7,
    });
  });
});

describe('handleOnboardingText', () => {
  it('step 1: treats text as language name', async () => {
    const ctx = makeCtx(1, 'Italian');

    await handleOnboardingText(ctx);

    expect(mockUpdateUser).toHaveBeenCalledWith('uuid-123', { language: 'it', onboarding_step: 2 });
  });

  it('step 2: treats text as name', async () => {
    const ctx = makeCtx(2, 'Ramil');

    await handleOnboardingText(ctx);

    expect(mockUpdateUser).toHaveBeenCalledWith('uuid-123', { display_name: 'Ramil', onboarding_step: 3 });
  });

  it('step 3: asks to retry when timezone not recognized', async () => {
    const ctx = makeCtx(3, 'asdasd');

    await handleOnboardingText(ctx);

    // mockResolveTimezone returns null, so should ask to try again
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining('couldn\'t figure out'),
    );
  });
});
