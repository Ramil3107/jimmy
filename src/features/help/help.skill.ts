import type { Skill } from '../../core/skills/types.js';
import type { BotContext } from '../../bot/context.js';

export const helpSkill: Skill = {
  name: 'help',
  intents: ['help'],
  description: 'ONLY when user explicitly asks what the bot can do or types /help. NOT for general questions.',
  examples: [
    '/help',
    'what can you do?',
    'show me your features',
    'list your commands',
  ],
  handler: async (ctx: BotContext): Promise<void> => {
    const name = ctx.user.display_name || 'friend';

    const text =
      `Hey ${name}! Here\'s what I can do:\n\n` +
      '💬 *Chat* — Talk to me about anything\n\n' +
      '📋 *Tasks*\n' +
      '  • "Remind me to call mom tomorrow at 3pm"\n' +
      '  • "Show my tasks" / "What\'s on for this week?"\n' +
      '  • "Mark call mom as done"\n' +
      '  • I\'ll send you reminders with snooze options!\n\n' +
      '📝 *Notes* — coming soon\n' +
      '📅 *Calendar* — coming soon\n\n' +
      '🎤 You can also send voice messages!\n\n' +
      '💡 Just talk to me naturally — I\'ll figure out what you need!';

    await ctx.reply(text, { parse_mode: 'Markdown' });
  },
};
