import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetByTelegramId = vi.hoisted(() => vi.fn());
const mockCreateUser = vi.hoisted(() => vi.fn());
const mockUpdateLastActive = vi.hoisted(() => vi.fn());

vi.mock('../../features/users/user.repo.js', () => ({
  getByTelegramId: mockGetByTelegramId,
  createUser: mockCreateUser,
  updateLastActive: mockUpdateLastActive,
}));

vi.mock('../../core/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { authMiddleware } from './auth.js';
import type { BotContext } from '../context.js';
import type { User } from '../../features/users/user.types.js';

const fakeUser: User = {
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

function makeCtx(fromId?: number, firstName?: string): BotContext {
  return {
    from: fromId ? { id: fromId, first_name: firstName } : undefined,
  } as unknown as BotContext;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdateLastActive.mockResolvedValue(undefined);
});

describe('authMiddleware', () => {
  it('attaches existing user to ctx and calls next', async () => {
    mockGetByTelegramId.mockResolvedValue(fakeUser);
    const ctx = makeCtx(12345678);
    const next = vi.fn();

    await authMiddleware(ctx, next);

    expect(mockGetByTelegramId).toHaveBeenCalledWith(12345678);
    expect(ctx.user).toEqual(fakeUser);
    expect(next).toHaveBeenCalled();
  });

  it('creates new user when not found', async () => {
    mockGetByTelegramId.mockResolvedValue(null);
    mockCreateUser.mockResolvedValue(fakeUser);
    const ctx = makeCtx(12345678, 'Test');
    const next = vi.fn();

    await authMiddleware(ctx, next);

    expect(mockCreateUser).toHaveBeenCalledWith({
      telegram_id: 12345678,
      display_name: 'Test',
    });
    expect(ctx.user).toEqual(fakeUser);
    expect(next).toHaveBeenCalled();
  });

  it('skips when no from.id', async () => {
    const ctx = makeCtx();
    const next = vi.fn();

    await authMiddleware(ctx, next);

    expect(mockGetByTelegramId).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('calls updateLastActive (fire-and-forget)', async () => {
    mockGetByTelegramId.mockResolvedValue(fakeUser);
    const ctx = makeCtx(12345678);
    const next = vi.fn();

    await authMiddleware(ctx, next);

    expect(mockUpdateLastActive).toHaveBeenCalledWith(fakeUser.id);
  });

  it('does not block on updateLastActive failure', async () => {
    mockGetByTelegramId.mockResolvedValue(fakeUser);
    mockUpdateLastActive.mockRejectedValue(new Error('db error'));
    const ctx = makeCtx(12345678);
    const next = vi.fn();

    await authMiddleware(ctx, next);

    expect(next).toHaveBeenCalled();
  });
});
