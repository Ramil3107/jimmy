import type { Skill } from '../../core/skills/types.js';
import type { BotContext } from '../../bot/context.js';
import type { Task } from './task.types.js';
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

// --- Create ---

async function handleCreateTask(ctx: BotContext, params: Record<string, unknown>, confirmed: boolean): Promise<void> {
  const title = params.title as string;
  if (!title) {
    await ctx.reply('I need a title for the task. What should I call it?');
    return;
  }

  if (confirmed) {
    const task = await createTask({
      user_id: ctx.user.id,
      title,
      description: (params.description as string) || undefined,
      due_date: (params.due_date as string) || undefined,
      remind_at: (params.remind_at as string) || undefined,
    });

    let msg = `✅ Task created: *${escMd(task.title)}*`;
    if (task.due_date) msg += `\n📅 Due: ${formatDate(task.due_date, ctx.user.timezone)}`;
    if (task.remind_at) msg += `\n🔔 Reminder: ${formatDate(task.remind_at, ctx.user.timezone)}`;

    await ctx.editMessageText(msg, { parse_mode: 'Markdown' });
    return;
  }

  let confirmMsg = `📋 Create task: *${escMd(title)}*`;
  if (params.due_date) confirmMsg += `\n📅 Due: ${formatDate(params.due_date as string, ctx.user.timezone)}`;
  if (params.remind_at) confirmMsg += `\n🔔 Reminder: ${formatDate(params.remind_at as string, ctx.user.timezone)}`;
  if (params.description) confirmMsg += `\n📝 ${params.description}`;

  const actionId = setPendingAction(ctx.user.id, 'create_task', { ...params, intent: 'create_task' }, confirmMsg);
  await ctx.reply(confirmMsg, {
    parse_mode: 'Markdown',
    reply_markup: confirmCancelKeyboard(actionId),
  });
}

// --- List ---

async function handleListTasks(ctx: BotContext, params: Record<string, unknown>): Promise<void> {
  const view = (params.view as string) || (params.status as string) || 'today';

  switch (view) {
    case 'week':
      await showWeekView(ctx);
      return;
    case 'all':
      await showAllTasks(ctx);
      return;
    case 'done':
      await showDoneTasks(ctx);
      return;
    default:
      await showTodayTasks(ctx);
      return;
  }
}

async function showTodayTasks(ctx: BotContext): Promise<void> {
  const allTasks = await getTasksByUser(ctx.user.id, { includeDone: true, limit: 50 });
  const tz = ctx.user.timezone;
  const todayStr = getDateInTimezone(new Date(), tz);

  const todayOpen: Task[] = [];
  const todayDone: Task[] = [];
  const noDated: Task[] = [];

  for (const t of allTasks) {
    if (t.due_date) {
      const taskDay = getDateInTimezone(new Date(t.due_date), tz);
      if (taskDay === todayStr) {
        if (t.is_done) todayDone.push(t);
        else todayOpen.push(t);
      }
    } else if (!t.is_done) {
      noDated.push(t);
    }
  }

  const name = escV2(ctx.user.display_name || 'friend');

  // No tasks at all
  if (todayOpen.length === 0 && noDated.length === 0 && todayDone.length === 0) {
    await ctx.reply(escV2(pick(emptyDayPhrases, ctx.user.display_name || 'friend')), { parse_mode: 'MarkdownV2' });
    return;
  }

  // All done!
  if (todayOpen.length === 0 && noDated.length === 0 && todayDone.length > 0) {
    const lines: string[] = [escV2(pick(allDonePhrases, ctx.user.display_name || 'friend'))];
    lines.push('');
    lines.push('✅ _Completed:_\n');
    for (const t of todayDone) {
      lines.push(`✓  ~${escV2(t.title)}~`);
    }
    await ctx.reply(lines.join('\n'), { parse_mode: 'MarkdownV2' });
    return;
  }

  const lines: string[] = ['📋 *Today*\n'];

  for (const t of todayOpen) {
    const time = t.due_date ? `  ·  ${formatTime(t.due_date, tz)}` : '';
    lines.push(`○  ${escV2(t.title)}${time}`);
  }
  for (const t of noDated) {
    lines.push(`○  ${escV2(t.title)}`);
  }

  if (todayDone.length > 0) {
    lines.push('\n✅ _Completed:_\n');
    for (const t of todayDone) {
      lines.push(`✓  ~${escV2(t.title)}~`);
    }
  }

  await ctx.reply(lines.join('\n'), { parse_mode: 'MarkdownV2' });
}

async function showAllTasks(ctx: BotContext): Promise<void> {
  const tasks = await getTasksByUser(ctx.user.id, { includeDone: false, limit: 50 });

  if (tasks.length === 0) {
    await ctx.reply(escV2(pick(noOpenPhrases, ctx.user.display_name || 'friend')), { parse_mode: 'MarkdownV2' });
    return;
  }

  const lines: string[] = [`📋 *All open tasks* \\(${tasks.length}\\)\n`];
  for (const t of tasks) {
    const date = t.due_date ? `  ·  ${formatDate(t.due_date, ctx.user.timezone)}` : '';
    lines.push(`○  ${escV2(t.title)}${escV2(date)}`);
  }

  await ctx.reply(lines.join('\n'), { parse_mode: 'MarkdownV2' });
}

async function showDoneTasks(ctx: BotContext): Promise<void> {
  const tasks = await getTasksByUser(ctx.user.id, { includeDone: true, limit: 50 });
  const done = tasks.filter((t) => t.is_done);

  if (done.length === 0) {
    await ctx.reply(escV2('No completed tasks yet. Get to work! :)'), { parse_mode: 'MarkdownV2' });
    return;
  }

  const lines: string[] = [`✓ *Completed* \\(${done.length}\\)\n`];
  for (const t of done) {
    lines.push(`✓  ~${escV2(t.title)}~`);
  }

  await ctx.reply(lines.join('\n'), { parse_mode: 'MarkdownV2' });
}

async function showWeekView(ctx: BotContext): Promise<void> {
  const allTasks = await getTasksByUser(ctx.user.id, { includeDone: true, limit: 100 });
  const tz = ctx.user.timezone;
  const now = new Date();

  const days: { label: string; dateStr: string }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    const dateStr = getDateInTimezone(d, tz);
    const dayName = d.toLocaleDateString('en-US', { timeZone: tz, weekday: 'long' });
    const dayDate = d.toLocaleDateString('en-US', { timeZone: tz, month: 'short', day: 'numeric' });
    const label = i === 0 ? `Today, ${dayDate}` : `${dayName}, ${dayDate}`;
    days.push({ label, dateStr });
  }

  const lines: string[] = ['📅 *This week*\n'];
  let hasAny = false;

  for (const day of days) {
    const dayTasks = allTasks.filter((t) => {
      if (!t.due_date) return false;
      return getDateInTimezone(new Date(t.due_date), tz) === day.dateStr;
    });

    if (dayTasks.length === 0) continue;
    hasAny = true;

    lines.push(`\n*${escV2(day.label)}*`);
    for (const t of dayTasks) {
      const prefix = t.is_done ? '✓' : '○';
      const title = t.is_done ? `~${escV2(t.title)}~` : escV2(t.title);
      const time = t.due_date ? `  ·  ${formatTime(t.due_date, tz)}` : '';
      lines.push(`${prefix}  ${title}${escV2(time)}`);
    }
  }

  const noDated = allTasks.filter((t) => !t.due_date && !t.is_done);
  if (noDated.length > 0) {
    hasAny = true;
    lines.push('\n*No date*');
    for (const t of noDated) {
      lines.push(`○  ${escV2(t.title)}`);
    }
  }

  if (!hasAny) {
    await ctx.reply(escV2(pick(emptyWeekPhrases, ctx.user.display_name || 'friend')), { parse_mode: 'MarkdownV2' });
    return;
  }

  await ctx.reply(lines.join('\n'), { parse_mode: 'MarkdownV2' });
}

// --- Complete ---

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
    await ctx.editMessageText(`✅ Done: *${escMd(task.title)}*`, { parse_mode: 'Markdown' });
    return;
  }

  const match = await findTaskByQuery(ctx.user.id, titleQuery, false);
  if (!match) { await ctx.reply(`I couldn't find an open task matching "${titleQuery}".`); return; }
  if (Array.isArray(match)) { await showAmbiguous(ctx, match, 'complete'); return; }

  const actionId = setPendingAction(ctx.user.id, 'complete_task', { ...params, intent: 'complete_task', task_id: match.id }, `Complete: ${match.title}`);
  await ctx.reply(`Mark as done: *${escMd(match.title)}*?`, {
    parse_mode: 'Markdown',
    reply_markup: confirmCancelKeyboard(actionId),
  });
}

// --- Edit ---

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
    let msg = `✏️ Updated: *${escMd(task.title)}*`;
    if (task.due_date) msg += `\n📅 Due: ${formatDate(task.due_date, ctx.user.timezone)}`;
    if (task.remind_at) msg += `\n🔔 Reminder: ${formatDate(task.remind_at, ctx.user.timezone)}`;
    await ctx.editMessageText(msg, { parse_mode: 'Markdown' });
    return;
  }

  // Search both open and done tasks for editing
  const match = await findTaskByQuery(ctx.user.id, titleQuery, true);
  if (!match) { await ctx.reply(`I couldn't find a task matching "${titleQuery}".`); return; }
  if (Array.isArray(match)) { await showAmbiguous(ctx, match, 'edit'); return; }

  const actionId = setPendingAction(ctx.user.id, 'edit_task', { ...params, intent: 'edit_task', task_id: match.id }, `Edit: ${match.title}`);

  let msg = `✏️ Edit task: *${escMd(match.title)}*\n\nChanges:`;
  if (updates?.title) msg += `\n• Title → ${updates.title}`;
  if (updates?.due_date) msg += `\n• Due → ${formatDate(updates.due_date as string, ctx.user.timezone)}`;
  if (updates?.remind_at) msg += `\n• Reminder → ${formatDate(updates.remind_at as string, ctx.user.timezone)}`;
  if (!updates || Object.keys(updates).length === 0) msg += '\n_(no changes specified)_';

  await ctx.reply(msg, {
    parse_mode: 'Markdown',
    reply_markup: confirmCancelKeyboard(actionId),
  });
}

// --- Delete ---

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
    await ctx.editMessageText(`🗑️ Deleted: *${escMd(taskTitle || 'task')}*`, { parse_mode: 'Markdown' });
    return;
  }

  // Search ALL tasks (including done) for deletion
  const match = await findTaskByQuery(ctx.user.id, titleQuery, true);
  if (!match) { await ctx.reply(`I couldn't find a task matching "${titleQuery}".`); return; }
  if (Array.isArray(match)) { await showAmbiguous(ctx, match, 'delete'); return; }

  const doneLabel = match.is_done ? ' _(completed)_' : '';
  const actionId = setPendingAction(
    ctx.user.id,
    'delete_task',
    { ...params, intent: 'delete_task', task_id: match.id, task_title: match.title },
    `Delete: ${match.title}`,
  );
  await ctx.reply(`⚠️ Delete task: *${escMd(match.title)}*${doneLabel}?\n\nThis cannot be undone.`, {
    parse_mode: 'Markdown',
    reply_markup: confirmCancelKeyboard(actionId),
  });
}

// --- Helpers ---

/**
 * Find a task by fuzzy title match.
 * @param includeDone - if true, also searches completed tasks (for delete/edit)
 */
async function findTaskByQuery(userId: string, query: string, includeDone: boolean): Promise<Task | Task[] | null> {
  const tasks = await getTasksByUser(userId, { includeDone, limit: 50 });
  const lower = query.toLowerCase();

  // Try exact match first
  const exact = tasks.filter((t) => t.title.toLowerCase() === lower);
  if (exact.length === 1) return exact[0];

  // Then substring
  const matches = tasks.filter((t) => t.title.toLowerCase().includes(lower));
  if (matches.length === 0) {
    // Try word-by-word matching (each word of query appears in title)
    const words = lower.split(/\s+/).filter((w) => w.length > 2);
    if (words.length > 0) {
      const wordMatches = tasks.filter((t) => {
        const titleLower = t.title.toLowerCase();
        return words.some((w) => titleLower.includes(w));
      });
      if (wordMatches.length === 1) return wordMatches[0];
      if (wordMatches.length > 1) return wordMatches.slice(0, 5);
    }
    return null;
  }
  if (matches.length === 1) return matches[0];
  return matches.slice(0, 5);
}

async function showAmbiguous(ctx: BotContext, tasks: Task[], action: string): Promise<void> {
  const lines = tasks.map((t, i) => {
    const icon = t.is_done ? '✅' : '⬜';
    return `${icon} ${i + 1}. *${escMd(t.title)}*`;
  });
  await ctx.reply(
    `I found multiple tasks. Which one do you want to ${action}?\n\n${lines.join('\n')}\n\nPlease be more specific.`,
    { parse_mode: 'Markdown' },
  );
}

function formatDate(isoString: string, timezone: string): string {
  try {
    return new Date(isoString).toLocaleString('en-US', {
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

function formatTime(isoString: string, timezone: string): string {
  try {
    return new Date(isoString).toLocaleString('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

/** Get YYYY-MM-DD string for a date in a timezone */
function getDateInTimezone(date: Date, timezone: string): string {
  return date.toLocaleDateString('sv-SE', { timeZone: timezone }); // sv-SE gives YYYY-MM-DD
}

/** Escape Markdown special chars in user content */
function escMd(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

/** Escape for MarkdownV2 (stricter) */
function escV2(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

/** Pick a random phrase, injecting the user's name */
function pick(phrases: string[], name: string): string {
  const idx = Math.floor(Math.random() * phrases.length);
  return phrases[idx].replace('{name}', name);
}

const emptyDayPhrases = [
  "Your day is wide open, {name}! No tasks for today. Say \"remind me to...\" to add something.",
  "Nothing on the agenda today! Want to add a task? Just tell me what you need to do.",
  "Clean slate today, {name}. Enjoy it or say \"remind me to...\" to plan something!",
  "No tasks for today. Feeling productive? Tell me what you'd like to get done!",
  "Today's looking free, {name}! Need to plan something? I'm here.",
];

const allDonePhrases = [
  "Amazing, {name}! Everything's done for today. Take a well-deserved break!",
  "Wow, all done! Great job, {name}. You crushed it today!",
  "{name}, you're on fire! All tasks completed. Rest up, you earned it.",
  "Look at you go, {name}! Nothing left to do. Enjoy the rest of your day!",
  "All caught up! Nice work, {name}. Treat yourself to something nice.",
];

const noOpenPhrases = [
  "No open tasks! You're all caught up, {name}.",
  "Nothing pending! Want to add something? Just say \"remind me to...\"",
  "All clear, {name}! Your task list is empty.",
  "Zero tasks! Either you're super productive or very relaxed. Both are great!",
];

const emptyWeekPhrases = [
  "Nothing planned this week, {name}. Enjoy the calm!",
  "Your week is wide open! Want to plan something? Just tell me.",
  "No tasks this week. Time to recharge, {name}!",
  "A completely free week! Rare and beautiful. Or just say \"remind me to...\" to change that.",
];
