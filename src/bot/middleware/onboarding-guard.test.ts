import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BotContext } from '../context.js';
import type { User } from '../../features/users/user.types.js';

const mockHandleOnboardingText = vi.hoisted(() => vi.fn());

vi.mock('../../features/onboarding/onboarding.handler.js', () => ({
  handleOnboardingText: mockHandleOnboardingText,
}));

import { onboardingGuard } from './onboarding-guard.js';

const baseUser: User = {
  id: 'uuid-123',
  telegram_id: 12345678,
  display_name: 'Test',
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

function makeCtx(overrides: {
  onboarding_complete?: boolean;
  text?: string;
  callbackQuery?: boolean;
} = {}): BotContext {
  return {
    user: { ...baseUser, onboarding_complete: overrides.onboarding_complete ?? false },
    message: overrides.text !== undefined ? { text: overrides.text } : undefined,
    callbackQuery: overrides.callbackQuery ? { data: 'test' } : undefined,
    reply: vi.fn(),
  } as unknown as BotContext;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('onboardingGuard', () => {
  it('calls next() for onboarded users', async () => {
    const ctx = makeCtx({ onboarding_complete: true, text: 'hello' });
    const next = vi.fn();

    await onboardingGuard(ctx, next);

    expect(next).toHaveBeenCalled();
    expect(mockHandleOnboardingText).not.toHaveBeenCalled();
  });

  it('routes non-onboarded users to onboarding handler', async () => {
    const ctx = makeCtx({ onboarding_complete: false, text: 'hello' });
    const next = vi.fn();

    await onboardingGuard(ctx, next);

    expect(next).not.toHaveBeenCalled();
    expect(mockHandleOnboardingText).toHaveBeenCalledWith(ctx);
  });

  it('allows /start through for non-onboarded users', async () => {
    const ctx = makeCtx({ onboarding_complete: false, text: '/start' });
    const next = vi.fn();

    await onboardingGuard(ctx, next);

    expect(next).toHaveBeenCalled();
    expect(mockHandleOnboardingText).not.toHaveBeenCalled();
  });

  it('allows callback queries through', async () => {
    const ctx = makeCtx({ onboarding_complete: false, callbackQuery: true });
    const next = vi.fn();

    await onboardingGuard(ctx, next);

    expect(next).toHaveBeenCalled();
    expect(mockHandleOnboardingText).not.toHaveBeenCalled();
  });
});
