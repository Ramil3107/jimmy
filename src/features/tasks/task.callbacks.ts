import type { BotContext } from '../../bot/context.js';
import { updateTask, completeTask, getTaskById } from './task.repo.js';
import { snoozeKeyboard } from '../../bot/keyboards.js';
import { logger } from '../../core/logger.js';

/**
 * Handle snooze callback: update remind_at to now + minutes, re-show snooze keyboard.
 */
export async function handleSnooze(ctx: BotContext, taskId: string, minutes: number): Promise<void> {
  const task = await getTaskById(taskId);

  if (!task) {
    await ctx.answerCallbackQuery('Task not found.');
    await ctx.editMessageText('⚠️ This task no longer exists.');
    return;
  }

  if (task.is_done) {
    await ctx.answerCallbackQuery('Task already completed.');
    await ctx.editMessageText(`✅ Already done: *${escMd(task.title)}*`, { parse_mode: 'Markdown' });
    return;
  }

  const newRemindAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();
  await updateTask(taskId, { remind_at: newRemindAt });

  const label = minutes < 60 ? `${minutes}min` : `${minutes / 60}hr`;
  await ctx.answerCallbackQuery(`⏰ Snoozed +${label}`);
  await ctx.editMessageText(
    `⏰ Snoozed: *${escMd(task.title)}*\nI'll remind you again in ${label}.`,
    { parse_mode: 'Markdown' },
  );

  logger.debug({ taskId, minutes, newRemindAt }, 'Task snoozed');
}

/**
 * Handle "Done" callback on reminder: mark task complete, remove keyboard.
 */
export async function handleSnoozeDone(ctx: BotContext, taskId: string): Promise<void> {
  const task = await getTaskById(taskId);

  if (!task) {
    await ctx.answerCallbackQuery('Task not found.');
    await ctx.editMessageText('⚠️ This task no longer exists.');
    return;
  }

  if (task.is_done) {
    await ctx.answerCallbackQuery('Already done!');
    await ctx.editMessageText(`✅ Already done: *${escMd(task.title)}*`, { parse_mode: 'Markdown' });
    return;
  }

  await completeTask(taskId);
  await ctx.answerCallbackQuery('✅ Done!');
  await ctx.editMessageText(`✅ Done: *${escMd(task.title)}*`, { parse_mode: 'Markdown' });

  logger.debug({ taskId }, 'Task marked done from reminder');
}

function escMd(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}
