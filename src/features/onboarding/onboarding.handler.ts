import { InlineKeyboard } from 'grammy';
import type { BotContext } from '../../bot/context.js';
import { updateUser } from '../users/user.repo.js';
import {
  languageKeyboard,
  digestTimeKeyboard,
} from '../../bot/keyboards.js';
import { logger } from '../../core/logger.js';
import { resolveTimezone, mockResolveTimezone } from './timezone-resolver.js';
import { env } from '../../config/env.js';

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
      // Language step skipped — default to English, advance to name
      await updateUser(ctx.user.id, { language: 'en', onboarding_step: 2 });
      ctx.user.language = 'en';
      ctx.user.onboarding_step = 2;
      await stepNameInput(ctx);
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

/** Step 0 → Welcome, set language to English, skip to step 2 (name) */
async function stepWelcome(ctx: BotContext): Promise<void> {
  await ctx.reply(
    '👋 Hi! I\'m Jimmy, your personal assistant.\n\n' +
    'I can help you manage tasks, notes, calendar, and more — all through natural conversation.\n\n' +
    'Let\'s get you set up! It\'ll only take a minute.'
  );

  await updateUser(ctx.user.id, { language: 'en', onboarding_step: 2 });
  ctx.user.language = 'en';
  ctx.user.onboarding_step = 2;

  await stepNameInput(ctx);
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

/** Step 3 → Ask for timezone naturally */
async function stepTimezonePrompt(ctx: BotContext): Promise<void> {
  await ctx.reply(
    '🕐 Where are you located? Just type your city or country.\n\n' +
    'Examples: "Lisbon", "New York", "Germany", "Tokyo"',
  );
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
    await ctx.reply('Please type your preferred language in English (e.g. "Italian", "Korean", "Arabic"):');
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

// Known languages for free-text matching
const knownLanguages: Record<string, { name: string; code: string }> = {
  english: { name: 'English', code: 'en' },
  eng: { name: 'English', code: 'en' },
  ukrainian: { name: 'Українська', code: 'uk' },
  spanish: { name: 'Español', code: 'es' },
  german: { name: 'Deutsch', code: 'de' },
  french: { name: 'Français', code: 'fr' },
  portuguese: { name: 'Português', code: 'pt' },
  turkish: { name: 'Türkçe', code: 'tr' },
  azerbaijani: { name: 'Azərbaycan', code: 'az' },
  italian: { name: 'Italiano', code: 'it' },
  polish: { name: 'Polski', code: 'pl' },
  japanese: { name: '日本語', code: 'ja' },
  chinese: { name: '中文', code: 'zh' },
  arabic: { name: 'العربية', code: 'ar' },
  hindi: { name: 'हिन्दी', code: 'hi' },
  russian: { name: 'Русский', code: 'ru' },
  korean: { name: '한국어', code: 'ko' },
  dutch: { name: 'Nederlands', code: 'nl' },
  swedish: { name: 'Svenska', code: 'sv' },
  czech: { name: 'Čeština', code: 'cs' },
  romanian: { name: 'Română', code: 'ro' },
  greek: { name: 'Ελληνικά', code: 'el' },
  hebrew: { name: 'עברית', code: 'he' },
  thai: { name: 'ไทย', code: 'th' },
  vietnamese: { name: 'Tiếng Việt', code: 'vi' },
  indonesian: { name: 'Bahasa Indonesia', code: 'id' },
  malay: { name: 'Bahasa Melayu', code: 'ms' },
  finnish: { name: 'Suomi', code: 'fi' },
  danish: { name: 'Dansk', code: 'da' },
  norwegian: { name: 'Norsk', code: 'nb' },
  hungarian: { name: 'Magyar', code: 'hu' },
  bulgarian: { name: 'Български', code: 'bg' },
  serbian: { name: 'Српски', code: 'sr' },
  croatian: { name: 'Hrvatski', code: 'hr' },
  georgian: { name: 'ქართული', code: 'ka' },
  persian: { name: 'فارسی', code: 'fa' },
};

/** Handle free-text language input (when user chose "Other") */
export async function handleLanguageText(ctx: BotContext, text: string): Promise<void> {
  const input = text.trim().toLowerCase();

  if (input.length < 2 || input.length > 50) {
    await ctx.reply(
      'I didn\'t understand that. Please type a language name in English (e.g. "Italian", "Korean", "Arabic"):',
    );
    return;
  }

  const match = knownLanguages[input];
  if (match) {
    await updateUser(ctx.user.id, { language: match.code, onboarding_step: 2 });
    ctx.user.language = match.code;
    ctx.user.onboarding_step = 2;

    await ctx.reply(`✅ Got it — I'll speak ${match.name}!`);
    await stepNameInput(ctx);
    return;
  }

  await ctx.reply(
    `I don't recognize "${text.trim()}" as a language.\n\n` +
    'Please type the language name in English (e.g. "Italian", "Korean"), or pick from the list:',
    { reply_markup: languageKeyboard() },
  );
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

/** Handle timezone confirmation callback */
export async function handleTimezoneRegionCallback(ctx: BotContext, region: string): Promise<void> {
  if (region === 'retry') {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      '🕐 Let\'s try again. Where are you located?\n\n' +
      'Type your city or country (e.g. "Lisbon", "Germany", "Tokyo"):',
    );
    return;
  }

  await ctx.answerCallbackQuery();
}

/** Handle timezone selection callback */
export async function handleTimezoneCallback(ctx: BotContext, timezone: string): Promise<void> {
  await updateUser(ctx.user.id, { timezone, onboarding_step: 4 });
  ctx.user.timezone = timezone;
  ctx.user.onboarding_step = 4;

  await ctx.answerCallbackQuery(`✅ ${timezone}`);
  await stepDigestMorning(ctx);
}

/** Handle timezone text input — resolve via LLM */
export async function handleTimezoneText(ctx: BotContext, text: string): Promise<void> {
  const input = text.trim();

  if (input.length < 2 || input.length > 100) {
    await ctx.reply('Please type a city or country name (e.g. "Lisbon", "Germany", "Tokyo"):');
    return;
  }

  try {
    await ctx.replyWithChatAction('typing');

    const result = env.MOCK_LLM
      ? mockResolveTimezone(input)
      : await resolveTimezone(input);

    if (!result.timezone) {
      await ctx.reply(
        `I couldn't figure out a timezone from "${input}".\n\n` +
        'Please try a city or country name (e.g. "Lisbon", "New York", "Japan"):',
      );
      return;
    }

    // Ask for confirmation
    const kb = new InlineKeyboard()
      .text(`✅ Yes, ${result.display}`, `tz:${result.timezone}`)
      .text('❌ No, try again', 'tz_region:retry');

    await ctx.reply(
      `🕐 Got it — ${result.display} (${result.timezone}). Is that right?`,
      { reply_markup: kb },
    );
  } catch (err) {
    logger.error(err, 'Timezone resolution failed');
    await ctx.reply(
      'Something went wrong. Please try again with a city or country name:',
    );
  }
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
      await handleTimezoneText(ctx, text);
      break;
    default:
      await handleOnboarding(ctx);
  }
}
