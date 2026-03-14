import type { BotContext } from '../../bot/context.js';

export interface Skill {
  name: string;
  intents: string[];
  description: string;
  examples: string[];
  /** If true, message handler will NOT send the LLM's response_text (skill handles its own reply) */
  mutatesData?: boolean;
  handler: (ctx: BotContext, params: Record<string, unknown>) => Promise<void>;
}
