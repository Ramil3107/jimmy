import type { BotContext } from '../context.js';
import { routeMessage } from '../../core/llm/index.js';
import { getSkillByIntent, getSkillDescriptions } from '../../core/skills/registry.js';
import { logger } from '../../core/logger.js';
import type { RoutingContext } from '../../core/llm/types.js';

export async function handleMessage(ctx: BotContext, text: string): Promise<void> {
  const user = ctx.user;

  const context: RoutingContext = {
    user_name: user.display_name || 'friend',
    language: user.language,
    timezone: user.timezone,
    current_time: new Date().toISOString(),
    available_skills: getSkillDescriptions(),
    recent_messages: [], // TODO: fill from message history (Step 1.12)
  };

  try {
    const result = await routeMessage(text, context);

    logger.debug({ intent: result.intent, confidence: result.confidence }, 'Intent routed');

    // Confidence thresholds
    if (result.confidence < 0.3) {
      await ctx.reply(result.response_text || "I didn't quite understand. Could you rephrase that?");
      return;
    }

    if (result.confidence < 0.6 && result.intent === 'clarify') {
      await ctx.reply(result.response_text);
      return;
    }

    // Find and execute skill
    const skill = getSkillByIntent(result.intent);

    if (skill) {
      // For help skill, let it handle its own response
      if (skill.name === 'help') {
        await skill.handler(ctx, result.params);
        return;
      }

      // Execute skill handler (may do additional work)
      await skill.handler(ctx, result.params);
    }

    // Send LLM response text (for chat and unsupported intents)
    if (result.response_text) {
      await ctx.reply(result.response_text);
    }
  } catch (err) {
    logger.error(err, 'Message handling failed');
    await ctx.reply("Something went wrong. Please try again.");
  }
}
