import { Bot } from 'grammy';
import { env } from '../config/env.js';
import { logger } from '../core/logger.js';
import type { BotContext } from './context.js';
import { authMiddleware } from './middleware/auth.js';
import { onboardingGuard } from './middleware/onboarding-guard.js';
import {
  handleOnboarding,
  handleLanguageCallback,
  handleTimezoneRegionCallback,
  handleTimezoneCallback,
  handleDigestCallback,
} from '../features/onboarding/onboarding.handler.js';
import { handleVoice } from '../features/voice/voice.handler.js';

export const bot = new Bot<BotContext>(env.BOT_TOKEN);

bot.catch((err) => {
  logger.error(err, 'Bot error');
});

// Middleware pipeline
bot.use(authMiddleware);

// /start command — triggers onboarding for new users, re-greets onboarded users
bot.command('start', async (ctx) => {
  if (ctx.user.onboarding_complete) {
    const name = ctx.user.display_name || 'friend';
    await ctx.reply(`Welcome back, ${name}! How can I help you?`);
    return;
  }
  await handleOnboarding(ctx);
});

// Onboarding callback queries (must be before onboardingGuard for non-onboarded users)
bot.on('callback_query:data', async (ctx) => {
  const data = ctx.callbackQuery.data;

  // Language selection
  if (data.startsWith('lang:')) {
    const langCode = data.slice(5);
    await handleLanguageCallback(ctx, langCode);
    return;
  }

  // Timezone region selection
  if (data.startsWith('tz_region:')) {
    const region = data.slice(10);
    await handleTimezoneRegionCallback(ctx, region);
    return;
  }

  // Timezone city selection
  if (data.startsWith('tz:')) {
    const timezone = data.slice(3);
    await handleTimezoneCallback(ctx, timezone);
    return;
  }

  // Digest time selection
  if (data.startsWith('digest:')) {
    const parts = data.split(':');
    const type = parts[1] as 'morning' | 'evening';
    const time = parts.slice(2).join(':'); // rejoin in case time has colons
    await handleDigestCallback(ctx, type, time);
    return;
  }

  logger.warn({ data }, 'Unhandled callback query');
  await ctx.answerCallbackQuery('Unknown action');
});

// Onboarding guard — blocks non-onboarded users from reaching main handlers
bot.use(onboardingGuard);

// Voice message handler
bot.on('message:voice', async (ctx) => {
  const text = await handleVoice(ctx);
  if (text) {
    // TODO: pass to main message handler (Step 1.10)
    const name = ctx.user.display_name || 'friend';
    await ctx.reply(`${name}, I heard you! I'll learn to process this soon.`);
  }
});

// Temporary text handler — confirms full pipeline is working (post-onboarding)
bot.on('message:text', (ctx) => {
  const name = ctx.user.display_name || 'friend';
  return ctx.reply(`Hello, ${name}! You're fully onboarded. I'll learn to chat soon!`);
});
