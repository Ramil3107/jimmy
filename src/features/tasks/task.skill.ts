import type { Skill } from '../../core/skills/types.js';
import type { BotContext } from '../../bot/context.js';
import { createTask, getTasksByUser, completeTask, updateTask, deleteTask } from './task.repo.js';
import { setPendingAction } from '../../core/session/pending-actions.js';
import { confirmCancelKeyboard } from '../../bot/keyboards.js';
import { logger } from '../../core/logger.js';

export const taskSkill: Skill = {
  name: 'tasks',
  intents: ['create_task', 'list_tasks', 'complete_task', 'edit_task', 'delete_task'],
  description: 'Task management. Intents: create_task (when user says "remind me to...", "create task", "add task", "I need to..."), list_tasks (when user says "show tasks", "my tasks", "what do I need to do"), complete_task ("mark X as done", "I did X"), edit_task ("change X to Y"), delete_task ("delete X", "remove X").',
  examples: [
    'remind me to call mom tomorrow at 3pm → create_task',
    'show my tasks → list_tasks',
    'mark call mom as done → complete_task',
    'delete the grocery task → delete_task',
  ],
  mutatesData: true,
  handler: async (ctx: BotContext, params: Record<string, unknown>): Promise<void> => {
    const intent = params.intent as string || 'create_task';
    const confirmed = params.confirmed as boolean || false;

    logger.debug({ intent, confirmed, params }, 'Task skill handler called');

    switch (intent) {
      case 'create_task':
        await handleCreateTask(ctx, params, confirmed);
        break;
      case 'list_tasks':
        await handleListTasks(ctx, params);
        break;
      case 'complete_task':
        await handleCompleteTask(ctx, params, confirmed);
        break;
      case 'edit_task':
        await handleEditTask(ctx, params, confirmed);
        break;
      case 'delete_task':
        await handleDeleteTask(ctx, params, confirmed);
        break;
      default:
        await handleCreateTask(ctx, params, confirmed);
    }
  },
};

// --- Handlers ---

async function handleCreateTask(ctx: BotContext, params: Record<string, unknown>, confirmed: boolean): Promise<void> {
  const title = params.title as string;
  if (!title) {
    await ctx.reply('I need a title for the task. What should I call it?');
    return;
  }

  if (confirmed) {
    // Actually create the task
    const task = await createTask({
      user_id: ctx.user.id,
      title,
      description: (params.description as string) || undefined,
      due_date: (params.due_date as string) || undefined,
      remind_at: (params.remind_at as string) || undefined,
    });

    let msg = `✅ Task created: *${task.title}*`;
    if (task.due_date) {
      msg += `\n📅 Due: ${formatDate(task.due_date, ctx.user.timezone)}`;
    }
    if (task.remind_at) {
      msg += `\n🔔 Reminder: ${formatDate(task.remind_at, ctx.user.timezone)}`;
    }

    await ctx.editMessageText(msg, { parse_mode: 'Markdown' });
    return;
  }

  // Show confirmation
  let confirmMsg = `📋 Create task: *${title}*`;
  if (params.due_date) {
    confirmMsg += `\n📅 Due: ${formatDate(params.due_date as string, ctx.user.timezone)}`;
  }
  if (params.remind_at) {
    confirmMsg += `\n🔔 Reminder: ${formatDate(params.remind_at as string, ctx.user.timezone)}`;
  }
  if (params.description) {
    confirmMsg += `\n📝 ${params.description}`;
  }

  const actionId = setPendingAction(ctx.user.id, 'create_task', { ...params, intent: 'create_task' }, confirmMsg);
  await ctx.reply(confirmMsg, {
    parse_mode: 'Markdown',
    reply_markup: confirmCancelKeyboard(actionId),
  });
}

async function handleListTasks(ctx: BotContext, params: Record<string, unknown>): Promise<void> {
  const status = (params.status as string) || 'open';
  const includeDone = status === 'all' || status === 'done';

  let tasks = await getTasksByUser(ctx.user.id, { includeDone, limit: 20 });

  if (status === 'done') {
    tasks = tasks.filter((t) => t.is_done);
  }

  if (tasks.length === 0) {
    const msg = status === 'done'
      ? 'No completed tasks yet.'
      : 'You have no tasks yet. Try saying "remind me to..." to create one!';
    await ctx.reply(msg);
    return;
  }

  const lines = tasks.map((t, i) => {
    const check = t.is_done ? '✅' : '⬜';
    let line = `${check} ${i + 1}. *${t.title}*`;
    if (t.due_date) {
      line += ` — ${formatDate(t.due_date, ctx.user.timezone)}`;
    }
    return line;
  });

  const header = status === 'done' ? '✅ Completed tasks:' : '📋 Your tasks:';
  await ctx.reply(`${header}\n\n${lines.join('\n')}`, { parse_mode: 'Markdown' });
}

async function handleCompleteTask(ctx: BotContext, params: Record<string, unknown>, confirmed: boolean): Promise<void> {
  const titleQuery = params.title_query as string;
  if (!titleQuery) {
    await ctx.reply('Which task did you complete? Please describe it.');
    return;
  }

  if (confirmed) {
    const taskId = params.task_id as string;
    if (!taskId) return;
    const task = await completeTask(taskId);
    await ctx.editMessageText(`✅ Done: *${task.title}*`, { parse_mode: 'Markdown' });
    return;
  }

  const match = await findTaskByQuery(ctx.user.id, titleQuery);
  if (!match) { await ctx.reply(`I couldn't find a task matching "${titleQuery}".`); return; }
  if (Array.isArray(match)) { await showAmbiguous(ctx, match, 'complete'); return; }

  const actionId = setPendingAction(ctx.user.id, 'complete_task', { ...params, intent: 'complete_task', task_id: match.id }, `Complete: ${match.title}`);
  await ctx.reply(`Mark as done: *${match.title}*?`, {
    parse_mode: 'Markdown',
    reply_markup: confirmCancelKeyboard(actionId),
  });
}

async function handleEditTask(ctx: BotContext, params: Record<string, unknown>, confirmed: boolean): Promise<void> {
  const titleQuery = params.title_query as string;
  const updates = params.updates as Record<string, unknown> | undefined;

  if (!titleQuery) {
    await ctx.reply('Which task do you want to edit?');
    return;
  }

  if (confirmed) {
    const taskId = params.task_id as string;
    if (!taskId || !updates) return;
    const task = await updateTask(taskId, updates as any);
    await ctx.editMessageText(`✏️ Updated: *${task.title}*`, { parse_mode: 'Markdown' });
    return;
  }

  const match = await findTaskByQuery(ctx.user.id, titleQuery);
  if (!match) { await ctx.reply(`I couldn't find a task matching "${titleQuery}".`); return; }
  if (Array.isArray(match)) { await showAmbiguous(ctx, match, 'edit'); return; }

  const actionId = setPendingAction(ctx.user.id, 'edit_task', { ...params, intent: 'edit_task', task_id: match.id }, `Edit: ${match.title}`);

  let msg = `✏️ Edit task: *${match.title}*\n\nChanges:`;
  if (updates?.title) msg += `\n• Title → ${updates.title}`;
  if (updates?.due_date) msg += `\n• Due → ${formatDate(updates.due_date as string, ctx.user.timezone)}`;
  if (updates?.remind_at) msg += `\n• Reminder → ${formatDate(updates.remind_at as string, ctx.user.timezone)}`;

  await ctx.reply(msg, {
    parse_mode: 'Markdown',
    reply_markup: confirmCancelKeyboard(actionId),
  });
}

async function handleDeleteTask(ctx: BotContext, params: Record<string, unknown>, confirmed: boolean): Promise<void> {
  const titleQuery = params.title_query as string;
  if (!titleQuery) {
    await ctx.reply('Which task do you want to delete?');
    return;
  }

  if (confirmed) {
    const taskId = params.task_id as string;
    const taskTitle = params.task_title as string;
    if (!taskId) return;
    await deleteTask(taskId);
    await ctx.editMessageText(`🗑️ Deleted: *${taskTitle || 'task'}*`, { parse_mode: 'Markdown' });
    return;
  }

  const match = await findTaskByQuery(ctx.user.id, titleQuery);
  if (!match) { await ctx.reply(`I couldn't find a task matching "${titleQuery}".`); return; }
  if (Array.isArray(match)) { await showAmbiguous(ctx, match, 'delete'); return; }

  const actionId = setPendingAction(
    ctx.user.id,
    'delete_task',
    { ...params, intent: 'delete_task', task_id: match.id, task_title: match.title },
    `Delete: ${match.title}`,
  );
  await ctx.reply(`⚠️ Delete task: *${match.title}*?\n\nThis cannot be undone.`, {
    parse_mode: 'Markdown',
    reply_markup: confirmCancelKeyboard(actionId),
  });
}

// --- Helpers ---

import type { Task } from './task.types.js';

/** Find a task by fuzzy title match. Returns single task, array (ambiguous), or null (not found). */
async function findTaskByQuery(userId: string, query: string): Promise<Task | Task[] | null> {
  const tasks = await getTasksByUser(userId, { includeDone: false });
  const lower = query.toLowerCase();

  const matches = tasks.filter((t) => t.title.toLowerCase().includes(lower));

  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];
  return matches;
}

async function showAmbiguous(ctx: BotContext, tasks: Task[], action: string): Promise<void> {
  const lines = tasks.slice(0, 5).map((t, i) => `${i + 1}. *${t.title}*`);
  await ctx.reply(
    `I found multiple tasks matching that. Which one do you want to ${action}?\n\n${lines.join('\n')}\n\nPlease be more specific.`,
    { parse_mode: 'Markdown' },
  );
}

function formatDate(isoString: string, timezone: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      timeZone: timezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}
