import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rateLimitMiddleware } from './rate-limit.js';
import type { BotContext } from '../context.js';

function makeCtx(telegramId = 12345): BotContext {
  return {
    from: { id: telegramId },
    reply: vi.fn(),
  } as unknown as BotContext;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('rateLimitMiddleware', () => {
  it('allows messages under the limit', async () => {
    const ctx = makeCtx(1001);
    const next = vi.fn();

    await rateLimitMiddleware(ctx, next);

    expect(next).toHaveBeenCalled();
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it('blocks after 30 messages in 1 minute', async () => {
    const next = vi.fn();

    // Send 30 messages (should all pass)
    for (let i = 0; i < 30; i++) {
      const ctx = makeCtx(2002);
      await rateLimitMiddleware(ctx, next);
    }
    expect(next).toHaveBeenCalledTimes(30);

    // 31st should be blocked
    const ctx = makeCtx(2002);
    await rateLimitMiddleware(ctx, next);

    expect(next).toHaveBeenCalledTimes(30); // not incremented
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Too many messages'));
  });

  it('resets after window expires', async () => {
    const next = vi.fn();

    // Send 30 messages
    for (let i = 0; i < 30; i++) {
      await rateLimitMiddleware(makeCtx(3003), next);
    }

    // Advance time past 1 minute
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 61000);

    const ctx = makeCtx(3003);
    await rateLimitMiddleware(ctx, next);

    expect(next).toHaveBeenCalledTimes(31); // allowed again
  });

  it('tracks users independently', async () => {
    const next = vi.fn();

    await rateLimitMiddleware(makeCtx(4004), next);
    await rateLimitMiddleware(makeCtx(5005), next);

    expect(next).toHaveBeenCalledTimes(2);
  });

  it('passes through when no from.id', async () => {
    const ctx = { from: undefined, reply: vi.fn() } as unknown as BotContext;
    const next = vi.fn();

    await rateLimitMiddleware(ctx, next);

    expect(next).toHaveBeenCalled();
  });
});
