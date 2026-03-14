import type { Skill } from '../../core/skills/types.js';
import type { BotContext } from '../../bot/context.js';

export const chatSkill: Skill = {
  name: 'chat',
  intents: ['chat'],
  description: 'General conversation and free-form chat. Use when the user wants to talk, ask questions, or no other skill matches.',
  examples: [
    'hello',
    'how are you',
    'tell me a joke',
    'what do you think about...',
    'thanks',
  ],
  handler: async (ctx: BotContext, params: Record<string, unknown>): Promise<void> => {
    const responseText = params.response_text as string;
    if (responseText) {
      await ctx.reply(responseText);
    }
  },
};
