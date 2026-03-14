import type { BotContext } from '../../bot/context.js';
import { transcribe } from './transcriber.js';
import { logger } from '../../core/logger.js';

const MAX_DURATION_SECONDS = 300; // 5 minutes

export async function handleVoice(ctx: BotContext): Promise<string | null> {
  const voice = ctx.message?.voice;
  if (!voice) return null;

  // Check duration
  if (voice.duration > MAX_DURATION_SECONDS) {
    await ctx.reply('⚠️ Voice message is too long (max 5 minutes). Please send a shorter one.');
    return null;
  }

  try {
    // Show typing indicator while processing
    await ctx.replyWithChatAction('typing');

    // Download the voice file
    const file = await ctx.getFile();
    const fileUrl = `https://api.telegram.org/file/bot${ctx.api.token}/${file.file_path}`;
    const response = await fetch(fileUrl);

    if (!response.ok) {
      throw new Error(`Failed to download voice file: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Transcribe — pass user's language as hint for better accuracy
    const lang = ctx.user.language.length === 2 ? ctx.user.language : undefined;
    const text = await transcribe(buffer, lang);

    if (!text) {
      await ctx.reply("🎤 I couldn't make out what you said. Could you try again or send a text message?");
      return null;
    }

    // Show what we heard
    await ctx.reply(`🎤 Heard: "${text}"`);

    return text;
  } catch (err) {
    logger.error(err, 'Voice processing failed');
    await ctx.reply('😕 Something went wrong processing your voice message. Please try again or send text.');
    return null;
  }
}
