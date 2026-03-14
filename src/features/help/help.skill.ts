import type { Skill } from '../../core/skills/types.js';
import type { BotContext } from '../../bot/context.js';

export const helpSkill: Skill = {
  name: 'help',
  intents: ['help'],
  description: 'Show what the bot can do, list available skills and commands.',
  examples: [
    'help',
    'what can you do',
    '/help',
    'show me your features',
  ],
  handler: async (ctx: BotContext): Promise<void> => {
    const name = ctx.user.display_name || 'friend';

    const text =
      `Hey ${name}! Here\'s what I can do:\n\n` +
      '💬 *Chat* — Talk to me about anything\n' +
      '📋 *Tasks* — "Remind me to call mom tomorrow at 3pm"\n' +
      '📝 *Notes* — "Remember: pancake recipe — 2 eggs, flour, milk"\n' +
      '📅 *Calendar* — "What\'s on my schedule today?" (coming soon)\n\n' +
      '🎤 You can also send voice messages!\n\n' +
      '💡 Just talk to me naturally — I\'ll figure out what you need!';

    await ctx.reply(text, { parse_mode: 'Markdown' });
  },
};
