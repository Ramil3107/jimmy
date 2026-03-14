import type { BotContext } from '../../bot/context.js';

export interface Skill {
  name: string;
  intents: string[];
  description: string;
  examples: string[];
  handler: (ctx: BotContext, params: Record<string, unknown>) => Promise<void>;
}
