import type { NextFunction } from 'grammy';
import type { BotContext } from '../context.js';
import { getByTelegramId, createUser, updateLastActive } from '../../features/users/user.repo.js';
import { logger } from '../../core/logger.js';

export async function authMiddleware(ctx: BotContext, next: NextFunction): Promise<void> {
  const telegramId = ctx.from?.id;

  if (!telegramId) {
    logger.warn('Message without from.id — skipping');
    return;
  }

  let user = await getByTelegramId(telegramId);

  if (!user) {
    const displayName = ctx.from.first_name || ctx.from.username || undefined;
    user = await createUser({
      telegram_id: telegramId,
      display_name: displayName,
    });
    logger.info({ telegramId, userId: user.id }, 'New user created');
  }

  ctx.user = user;

  // Fire-and-forget — don't block the response
  updateLastActive(user.id).catch((err) => {
    logger.error(err, 'Failed to update last_active_at');
  });

  await next();
}
