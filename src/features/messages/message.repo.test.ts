import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFrom = vi.hoisted(() => vi.fn());

vi.mock('../../db/client.js', () => ({
  supabase: { from: mockFrom },
}));

import { saveMessage, getRecentMessages } from './message.repo.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('saveMessage', () => {
  it('inserts a message', async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    });

    await expect(saveMessage('user-1', 'user', 'hello', 'chat')).resolves.toBeUndefined();
    expect(mockFrom).toHaveBeenCalledWith('messages');
  });

  it('throws on insert error', async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: { message: 'db error' } }),
    });

    await expect(saveMessage('user-1', 'user', 'hello')).rejects.toThrow('Failed to save message: db error');
  });
});

describe('getRecentMessages', () => {
  it('returns messages in chronological order', async () => {
    const messages = [
      { id: '2', user_id: 'u1', role: 'assistant', content: 'hi', created_at: '2026-03-14T12:01:00Z' },
      { id: '1', user_id: 'u1', role: 'user', content: 'hello', created_at: '2026-03-14T12:00:00Z' },
    ];

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: messages, error: null }),
          }),
        }),
      }),
    });

    const result = await getRecentMessages('u1', 20);

    // Should be reversed (oldest first)
    expect(result[0].content).toBe('hello');
    expect(result[1].content).toBe('hi');
  });

  it('throws on query error', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'db error' } }),
          }),
        }),
      }),
    });

    await expect(getRecentMessages('u1')).rejects.toThrow('Failed to get messages: db error');
  });
});
