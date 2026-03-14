import type { BotContext } from '../../bot/context.js';
import { updateUser } from '../users/user.repo.js';
import {
  languageKeyboard,
  timezoneRegionKeyboard,
  timezoneCitiesKeyboard,
  digestTimeKeyboard,
  isValidTimezone,
} from '../../bot/keyboards.js';
import { logger } from '../../core/logger.js';

// Map Telegram language_code to our suggested timezone
const langToTimezone: Record<string, { tz: string; city: string }> = {
  uk: { tz: 'Europe/Kyiv', city: 'Kyiv' },
  az: { tz: 'Asia/Baku', city: 'Baku' },
  tr: { tz: 'Europe/Istanbul', city: 'Istanbul' },
  de: { tz: 'Europe/Berlin', city: 'Berlin' },
  fr: { tz: 'Europe/Paris', city: 'Paris' },
  es: { tz: 'Europe/Madrid', city: 'Madrid' },
  pt: { tz: 'America/Sao_Paulo', city: 'São Paulo' },
  it: { tz: 'Europe/Rome', city: 'Rome' },
  pl: { tz: 'Europe/Warsaw', city: 'Warsaw' },
  ja: { tz: 'Asia/Tokyo', city: 'Tokyo' },
  zh: { tz: 'Asia/Shanghai', city: 'Shanghai' },
  ko: { tz: 'Asia/Seoul', city: 'Seoul' },
  ar: { tz: 'Asia/Dubai', city: 'Dubai' },
  hi: { tz: 'Asia/Kolkata', city: 'Kolkata' },
  en: { tz: 'America/New_York', city: 'New York' },
  ru: { tz: 'Europe/Moscow', city: 'Moscow' },
};

/**
 * Handle messages from users who haven't completed onboarding.
 * Routes to the correct step based on ctx.user.onboarding_step.
 */
export async function handleOnboarding(ctx: BotContext): Promise<void> {
  const step = ctx.user.onboarding_step;

  switch (step) {
    case 0:
      await stepWelcome(ctx);
      break;
    case 1:
      await stepLanguagePrompt(ctx);
      break;
    case 2:
      await stepNameInput(ctx);
      break;
    case 3:
      await stepTimezonePrompt(ctx);
      break;
    case 4:
      await stepDigestMorning(ctx);
      break;
    case 5:
      await stepDigestEvening(ctx);
      break;
    case 6:
      await stepTour(ctx);
      break;
    default:
      logger.warn({ step, userId: ctx.user.id }, 'Unknown onboarding step');
      await ctx.reply('Something went wrong. Send /start to restart onboarding.');
  }
}

/** Step 0 → Welcome, then auto-advance to step 1 (language) */
async function stepWelcome(ctx: BotContext): Promise<void> {
  await ctx.reply(
    '👋 Hi! I\'m Jimmy, your personal assistant.\n\n' +
    'I can help you manage tasks, notes, calendar, and more — all through natural conversation.\n\n' +
    'Let\'s get you set up! It\'ll only take a minute.'
  );

  await updateUser(ctx.user.id, { onboarding_step: 1 });
  ctx.user.onboarding_step = 1;

  await stepLanguagePrompt(ctx);
}

/** Step 1 → Ask for language */
async function stepLanguagePrompt(ctx: BotContext): Promise<void> {
  await ctx.reply('🌍 What language would you like me to speak?', {
    reply_markup: languageKeyboard(),
  });
}

/** Step 2 → Ask for name */
async function stepNameInput(ctx: BotContext): Promise<void> {
  await ctx.reply('👤 How should I call you?');
}

/** Step 3 → Ask for timezone, try to suggest based on language */
async function stepTimezonePrompt(ctx: BotContext): Promise<void> {
  // Try to suggest timezone from Telegram language_code or selected language
  const langCode = ctx.from?.language_code || ctx.user.language;
  const suggestion = langToTimezone[langCode];

  if (suggestion) {
    await ctx.reply(
      `🕐 Based on your language, your timezone might be **${suggestion.city}** (${suggestion.tz}).\n\nIs that correct?`,
      {
        parse_mode: 'Markdown',
        reply_markup: timezoneSuggestionKeyboard(suggestion.tz, suggestion.city),
      },
    );
  } else {
    await ctx.reply('🕐 What\'s your timezone? Pick your region:', {
      reply_markup: timezoneRegionKeyboard(),
    });
  }
}

function timezoneSuggestionKeyboard(tz: string, city: string) {
  const { InlineKeyboard } = require('grammy') as typeof import('grammy');
  return new InlineKeyboard()
    .text(`✅ Yes, ${city}`, `tz:${tz}`)
    .text('❌ No, pick another', 'tz_region:pick')
    .row()
    .text('✏️ Type manually', 'tz_region:manual');
}

/** Step 4 → Ask for morning digest time */
async function stepDigestMorning(ctx: BotContext): Promise<void> {
  await ctx.reply('🌅 When would you like your morning digest?', {
    reply_markup: digestTimeKeyboard('morning'),
  });
}

/** Step 5 → Ask for evening digest time */
async function stepDigestEvening(ctx: BotContext): Promise<void> {
  await ctx.reply('🌙 When would you like your evening digest?', {
    reply_markup: digestTimeKeyboard('evening'),
  });
}

/** Step 6 → Mini tour + complete onboarding */
async function stepTour(ctx: BotContext): Promise<void> {
  const name = ctx.user.display_name || 'friend';

  await ctx.reply(
    `🎉 You're all set, ${name}!\n\n` +
    'Here\'s what I can do:\n\n' +
    '💬 *Chat* — Talk to me about anything\n' +
    '📋 *Tasks* — "Remind me to call mom tomorrow at 3pm"\n' +
    '📝 *Notes* — "Remember: pancake recipe — 2 eggs, flour, milk"\n' +
    '📅 *Calendar* — "What\'s on my schedule today?" (coming soon)\n\n' +
    '🎤 You can also send voice messages!\n\n' +
    'Type anything to start chatting!',
    { parse_mode: 'Markdown' }
  );

  await updateUser(ctx.user.id, { onboarding_complete: true, onboarding_step: 7 });
  ctx.user.onboarding_complete = true;
}

// --- Callback query handlers for inline keyboards ---

/** Handle language selection callback */
export async function handleLanguageCallback(ctx: BotContext, langCode: string): Promise<void> {
  if (langCode === 'other') {
    await ctx.reply('Please type your preferred language (e.g. "Italian", "日本語", "العربية"):');
    return;
  }

  await updateUser(ctx.user.id, { language: langCode, onboarding_step: 2 });
  ctx.user.language = langCode;
  ctx.user.onboarding_step = 2;

  const langNames: Record<string, string> = {
    en: 'English', uk: 'Українська', es: 'Español', de: 'Deutsch',
    fr: 'Français', pt: 'Português', tr: 'Türkçe', az: 'Azərbaycan',
    it: 'Italiano', pl: 'Polski', ja: '日本語', zh: '中文',
    ar: 'العربية', hi: 'हिन्दी',
  };

  await ctx.answerCallbackQuery(`✅ ${langNames[langCode] || langCode}`);
  await stepNameInput(ctx);
}

/** Handle free-text language input (when user chose "Other") */
export async function handleLanguageText(ctx: BotContext, text: string): Promise<void> {
  const language = text.trim();
  if (language.length < 2 || language.length > 50) {
    await ctx.reply('I didn\'t understand that. Please type a language name (e.g. "Italian", "日本語"):');
    return;
  }

  await updateUser(ctx.user.id, { language, onboarding_step: 2 });
  ctx.user.language = language;
  ctx.user.onboarding_step = 2;

  await ctx.reply(`✅ Got it — I'll speak ${language}!`);
  await stepNameInput(ctx);
}

/** Handle name input */
export async function handleNameInput(ctx: BotContext, text: string): Promise<void> {
  const name = text.trim();
  if (name.length < 1 || name.length > 100) {
    await ctx.reply('I didn\'t get that. Please enter a name (1-100 characters):');
    return;
  }

  await updateUser(ctx.user.id, { display_name: name, onboarding_step: 3 });
  ctx.user.display_name = name;
  ctx.user.onboarding_step = 3;

  await ctx.reply(`Nice to meet you, ${name}! 👋`);
  await stepTimezonePrompt(ctx);
}

/** Handle timezone region selection callback */
export async function handleTimezoneRegionCallback(ctx: BotContext, region: string): Promise<void> {
  if (region === 'back' || region === 'pick') {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText('🕐 What\'s your timezone? Pick your region:', {
      reply_markup: timezoneRegionKeyboard(),
    });
    return;
  }

  if (region === 'manual') {
    await ctx.answerCallbackQuery();
    await ctx.reply(
      '✏️ Please type your timezone in IANA format.\n\n' +
      'Examples: `Europe/Kyiv`, `America/New_York`, `Asia/Tokyo`\n\n' +
      'You can find yours at: timeanddate.com',
      { parse_mode: 'Markdown' },
    );
    return;
  }

  await ctx.answerCallbackQuery();
  await ctx.editMessageText('🕐 Pick your city:', {
    reply_markup: timezoneCitiesKeyboard(region),
  });
}

/** Handle timezone city selection callback */
export async function handleTimezoneCallback(ctx: BotContext, timezone: string): Promise<void> {
  await updateUser(ctx.user.id, { timezone, onboarding_step: 4 });
  ctx.user.timezone = timezone;
  ctx.user.onboarding_step = 4;

  await ctx.answerCallbackQuery(`✅ ${timezone}`);
  await stepDigestMorning(ctx);
}

/** Handle manual timezone text input */
export async function handleTimezoneText(ctx: BotContext, text: string): Promise<void> {
  const tz = text.trim();

  if (!isValidTimezone(tz)) {
    await ctx.reply(
      'I don\'t recognize that timezone. Please use IANA format like `Europe/Kyiv` or `America/New_York`.\n\n' +
      'Or use the buttons to pick from the list:',
      {
        parse_mode: 'Markdown',
        reply_markup: timezoneRegionKeyboard(),
      },
    );
    return;
  }

  await updateUser(ctx.user.id, { timezone: tz, onboarding_step: 4 });
  ctx.user.timezone = tz;
  ctx.user.onboarding_step = 4;

  await ctx.reply(`✅ Timezone set to ${tz}`);
  await stepDigestMorning(ctx);
}

/** Handle digest time selection callback */
export async function handleDigestCallback(
  ctx: BotContext,
  type: 'morning' | 'evening',
  time: string,
): Promise<void> {
  if (type === 'morning') {
    const morningTime = time === 'skip' ? null : time;
    await updateUser(ctx.user.id, {
      digest_morning_time: morningTime ?? undefined,
      onboarding_step: 5,
    });
    ctx.user.onboarding_step = 5;

    await ctx.answerCallbackQuery(time === 'skip' ? '⏭️ Skipped' : `✅ ${time}`);
    await stepDigestEvening(ctx);
  } else {
    const eveningTime = time === 'skip' ? null : time;
    await updateUser(ctx.user.id, {
      digest_evening_time: eveningTime ?? undefined,
      onboarding_step: 6,
    });
    ctx.user.onboarding_step = 6;

    await ctx.answerCallbackQuery(time === 'skip' ? '⏭️ Skipped' : `✅ ${time}`);
    await stepTour(ctx);
  }
}

/**
 * Route text messages during onboarding to the correct handler.
 */
export async function handleOnboardingText(ctx: BotContext): Promise<void> {
  const text = ctx.message?.text;
  if (!text) return;

  const step = ctx.user.onboarding_step;

  switch (step) {
    case 1:
      await handleLanguageText(ctx, text);
      break;
    case 2:
      await handleNameInput(ctx, text);
      break;
    case 3:
      // Manual timezone input
      await handleTimezoneText(ctx, text);
      break;
    default:
      // For steps that use inline keyboards, re-show the prompt
      await handleOnboarding(ctx);
  }
}
