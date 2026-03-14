import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BotContext } from '../../bot/context.js';
import type { User } from '../users/user.types.js';

const mockTranscribe = vi.hoisted(() => vi.fn());

vi.mock('./transcriber.js', () => ({
  transcribe: mockTranscribe,
}));

vi.mock('../../core/logger.js', () => ({
  logger: { error: vi.fn(), info: vi.fn() },
}));

import { handleVoice } from './voice.handler.js';

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

function makeCtx(duration = 10): BotContext {
  const mockBuffer = Buffer.from('fake-audio');
  return {
    user: { ...baseUser },
    message: { voice: { duration, file_id: 'abc' } },
    api: { token: 'test-token' },
    reply: vi.fn(),
    replyWithChatAction: vi.fn(),
    getFile: vi.fn().mockResolvedValue({ file_path: 'voice/file.ogg' }),
  } as unknown as BotContext;
}

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue({
    ok: true,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
  });
});

describe('handleVoice', () => {
  it('returns null if no voice message', async () => {
    const ctx = { message: {} } as unknown as BotContext;
    const result = await handleVoice(ctx);
    expect(result).toBeNull();
  });

  it('rejects voice messages over 5 minutes', async () => {
    const ctx = makeCtx(301);

    const result = await handleVoice(ctx);

    expect(result).toBeNull();
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('too long'));
  });

  it('transcribes and returns text', async () => {
    const ctx = makeCtx(10);
    mockTranscribe.mockResolvedValue('hello world');

    const result = await handleVoice(ctx);

    expect(result).toBe('hello world');
    expect(ctx.replyWithChatAction).toHaveBeenCalledWith('typing');
    expect(ctx.reply).toHaveBeenCalledWith('🎤 _"hello world"_', { parse_mode: 'Markdown' });
  });

  it('handles empty transcription', async () => {
    const ctx = makeCtx(10);
    mockTranscribe.mockResolvedValue('');

    const result = await handleVoice(ctx);

    expect(result).toBeNull();
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining("couldn't make out"));
  });

  it('handles transcription errors gracefully', async () => {
    const ctx = makeCtx(10);
    mockTranscribe.mockRejectedValue(new Error('API error'));

    const result = await handleVoice(ctx);

    expect(result).toBeNull();
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Something went wrong'));
  });

  it('handles file download failure', async () => {
    const ctx = makeCtx(10);
    mockFetch.mockResolvedValue({ ok: false, statusText: 'Not Found' });

    const result = await handleVoice(ctx);

    expect(result).toBeNull();
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Something went wrong'));
  });
});
