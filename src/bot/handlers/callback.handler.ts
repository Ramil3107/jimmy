import type { BotContext } from '../context.js';
import { confirmPendingAction, cancelPendingAction } from '../../core/session/pending-actions.js';
import { getSkillByIntent } from '../../core/skills/registry.js';
import { logger } from '../../core/logger.js';

export async function handleConfirmCallback(ctx: BotContext, actionId: string): Promise<void> {
  const action = confirmPendingAction(actionId);

  if (!action) {
    await ctx.answerCallbackQuery('⏰ This action has expired.');
    await ctx.editMessageText('⏰ Action expired. Please try again.');
    return;
  }

  const skill = getSkillByIntent(action.intent);
  if (!skill) {
    await ctx.answerCallbackQuery('❌ Error');
    await ctx.editMessageText('Something went wrong — skill not found.');
    return;
  }

  try {
    await skill.handler(ctx, action.params);
    await ctx.answerCallbackQuery('✅ Done!');
  } catch (err) {
    logger.error(err, 'Confirmation handler failed');
    await ctx.answerCallbackQuery('❌ Failed');
    await ctx.editMessageText('Something went wrong executing that action. Please try again.');
  }
}

export async function handleCancelCallback(ctx: BotContext, actionId: string): Promise<void> {
  cancelPendingAction(actionId);
  await ctx.answerCallbackQuery('❌ Cancelled');
  await ctx.editMessageText('❌ Cancelled.');
}
