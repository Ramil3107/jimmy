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
import { handleMessage } from './handlers/message.handler.js';
import { handleConfirmCallback, handleCancelCallback } from './handlers/callback.handler.js';
import { registerSkill } from '../core/skills/registry.js';
import { chatSkill } from '../features/chat/chat.skill.js';
import { helpSkill } from '../features/help/help.skill.js';

// Register skills
registerSkill(chatSkill);
registerSkill(helpSkill);

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
    const time = parts.slice(2).join(':');
    await handleDigestCallback(ctx, type, time);
    return;
  }

  // Confirmation system
  if (data.startsWith('confirm:')) {
    const actionId = data.slice(8);
    await handleConfirmCallback(ctx, actionId);
    return;
  }

  if (data.startsWith('cancel:')) {
    const actionId = data.slice(7);
    await handleCancelCallback(ctx, actionId);
    return;
  }

  logger.warn({ data }, 'Unhandled callback query');
  await ctx.answerCallbackQuery('Unknown action');
});

// Onboarding guard — blocks non-onboarded users from reaching main handlers
bot.use(onboardingGuard);

// Voice message handler — transcribe then process as text
bot.on('message:voice', async (ctx) => {
  const text = await handleVoice(ctx);
  if (text) {
    await handleMessage(ctx, text);
  }
});

// Text message handler — main entry point for all text
bot.on('message:text', (ctx) => {
  return handleMessage(ctx, ctx.message.text);
});
