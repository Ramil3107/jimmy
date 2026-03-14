import type { Skill } from '../../core/skills/types.js';
import type { BotContext } from '../../bot/context.js';
import { getAllSkills } from '../../core/skills/registry.js';

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
    const skills = getAllSkills();

    const lines = skills
      .filter((s) => s.name !== 'help') // don't list help itself
      .map((s) => {
        const examples = s.examples.slice(0, 2).map((e) => `"${e}"`).join(', ');
        return `• **${s.name}** — ${s.description}\n  Try: ${examples}`;
      });

    const text =
      '🤖 **Here\'s what I can do:**\n\n' +
      lines.join('\n\n') +
      '\n\n💡 Just talk to me naturally — I\'ll figure out what you need!';

    await ctx.reply(text, { parse_mode: 'Markdown' });
  },
};
