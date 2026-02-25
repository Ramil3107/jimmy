import { Bot } from 'grammy';
import { env } from '../config/env.js';
import { logger } from '../core/logger.js';

export const bot = new Bot(env.BOT_TOKEN);

bot.catch((err) => {
  logger.error(err, 'Bot error');
});

// Temporary echo handler — will be replaced by auth + routing
bot.on('message:text', (ctx) => ctx.reply(ctx.message.text));
