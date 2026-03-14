import type { NextFunction } from 'grammy';
import type { BotContext } from '../context.js';

const MAX_MESSAGES = 30;
const WINDOW_MS = 60 * 1000; // 1 minute

const counters = new Map<number, { count: number; resetAt: number }>();

export async function rateLimitMiddleware(ctx: BotContext, next: NextFunction): Promise<void> {
  const telegramId = ctx.from?.id;
  if (!telegramId) {
    await next();
    return;
  }

  const now = Date.now();
  let entry = counters.get(telegramId);

  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    counters.set(telegramId, entry);
  }

  entry.count++;

  if (entry.count > MAX_MESSAGES) {
    await ctx.reply('⏳ Too many messages! Please wait a moment before sending more.');
    return;
  }

  await next();
}
