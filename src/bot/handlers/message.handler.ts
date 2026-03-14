import type { BotContext } from '../context.js';
import { routeMessage } from '../../core/llm/index.js';
import { getSkillByIntent, getSkillDescriptions } from '../../core/skills/registry.js';
import { logger } from '../../core/logger.js';
import { getRecentMessages, saveMessage } from '../../features/messages/message.repo.js';
import type { RoutingContext } from '../../core/llm/types.js';

export async function handleMessage(ctx: BotContext, text: string): Promise<void> {
  const user = ctx.user;

  // Load recent chat history for LLM context
  let recentMessages: { role: 'user' | 'assistant'; content: string }[] = [];
  try {
    const history = await getRecentMessages(user.id, 20);
    recentMessages = history.map((m) => ({ role: m.role, content: m.content }));
  } catch (err) {
    logger.error(err, 'Failed to load message history');
  }

  const context: RoutingContext = {
    user_name: user.display_name || 'friend',
    language: user.language,
    timezone: user.timezone,
    current_time: new Date().toISOString(),
    available_skills: getSkillDescriptions(),
    recent_messages: recentMessages,
  };

  try {
    // Show typing indicator while LLM processes
    await ctx.replyWithChatAction('typing');

    const result = await routeMessage(text, context);

    logger.debug({ intent: result.intent, confidence: result.confidence }, 'Intent routed');

    // Save user message
    saveMessage(user.id, 'user', text, result.intent).catch((err) => {
      logger.error(err, 'Failed to save user message');
    });

    // Confidence thresholds
    if (result.confidence < 0.3) {
      const reply = result.response_text || "I didn't quite understand. Could you rephrase that?";
      await ctx.reply(reply);
      saveMessage(user.id, 'assistant', reply).catch((err) => {
        logger.error(err, 'Failed to save assistant message');
      });
      return;
    }

    if (result.confidence < 0.6 && result.intent === 'clarify') {
      await ctx.reply(result.response_text);
      saveMessage(user.id, 'assistant', result.response_text).catch((err) => {
        logger.error(err, 'Failed to save assistant message');
      });
      return;
    }

    // Find and execute skill
    const skill = getSkillByIntent(result.intent);

    if (skill) {
      if (skill.name === 'help') {
        await skill.handler(ctx, result.params);
        return;
      }

      await skill.handler(ctx, result.params);
    }

    // Send LLM response text
    if (result.response_text) {
      await ctx.reply(result.response_text);
      saveMessage(user.id, 'assistant', result.response_text, result.intent).catch((err) => {
        logger.error(err, 'Failed to save assistant message');
      });
    }
  } catch (err) {
    logger.error(err, 'Message handling failed');
    await ctx.reply("Something went wrong. Please try again.");
  }
}
