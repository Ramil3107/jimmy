import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { User } from './user.types.js';

// vi.hoisted ensures these are available when vi.mock factory runs
const mockFrom = vi.hoisted(() => vi.fn());

vi.mock('../../db/client.js', () => ({
  supabase: {
    from: mockFrom,
  },
}));

import { createUser, getByTelegramId, updateUser, updateLastActive } from './user.repo.js';

const fakeUser: User = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  telegram_id: 12345678,
  display_name: 'Test User',
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

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createUser', () => {
  it('creates a user and returns it', async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: fakeUser, error: null }),
        }),
      }),
    });

    const result = await createUser({ telegram_id: 12345678, display_name: 'Test User' });

    expect(mockFrom).toHaveBeenCalledWith('users');
    expect(result).toEqual(fakeUser);
  });

  it('throws on insert error', async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'duplicate key' } }),
        }),
      }),
    });

    await expect(createUser({ telegram_id: 12345678 })).rejects.toThrow('Failed to create user: duplicate key');
  });
});

describe('getByTelegramId', () => {
  it('returns user when found', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: fakeUser, error: null }),
        }),
      }),
    });

    const result = await getByTelegramId(12345678);

    expect(mockFrom).toHaveBeenCalledWith('users');
    expect(result).toEqual(fakeUser);
  });

  it('returns null when user not found (PGRST116)', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'No rows' } }),
        }),
      }),
    });

    const result = await getByTelegramId(99999);
    expect(result).toBeNull();
  });

  it('throws on unexpected error', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'OTHER', message: 'connection failed' } }),
        }),
      }),
    });

    await expect(getByTelegramId(12345678)).rejects.toThrow('Failed to get user: connection failed');
  });
});

describe('updateUser', () => {
  it('updates and returns user', async () => {
    const updated = { ...fakeUser, display_name: 'New Name' };
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: updated, error: null }),
          }),
        }),
      }),
    });

    const result = await updateUser(fakeUser.id, { display_name: 'New Name' });

    expect(mockFrom).toHaveBeenCalledWith('users');
    expect(result).toEqual(updated);
  });

  it('throws on update error', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
          }),
        }),
      }),
    });

    await expect(updateUser('bad-id', { display_name: 'X' })).rejects.toThrow('Failed to update user: not found');
  });
});

describe('updateLastActive', () => {
  it('updates last_active_at without error', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    await expect(updateLastActive(fakeUser.id)).resolves.toBeUndefined();
    expect(mockFrom).toHaveBeenCalledWith('users');
  });

  it('throws on error', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: 'db down' } }),
      }),
    });

    await expect(updateLastActive(fakeUser.id)).rejects.toThrow('Failed to update last_active_at: db down');
  });
});
