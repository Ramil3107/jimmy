import type { NextFunction } from 'grammy';
import type { BotContext } from '../context.js';
import { handleOnboardingText } from '../../features/onboarding/onboarding.handler.js';

export async function onboardingGuard(ctx: BotContext, next: NextFunction): Promise<void> {
  // Allow /start command through always
  if (ctx.message?.text === '/start') {
    await next();
    return;
  }

  // Allow callback queries through (handled separately in bot.ts)
  if (ctx.callbackQuery) {
    await next();
    return;
  }

  if (!ctx.user.onboarding_complete) {
    await handleOnboardingText(ctx);
    return;
  }

  await next();
}
