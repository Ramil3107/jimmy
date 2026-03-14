import cron from 'node-cron';
import { Bot } from 'grammy';
import type { BotContext } from '../../bot/context.js';
import { getDueReminders, clearReminder } from '../../features/tasks/task.repo.js';
import { snoozeKeyboard } from '../../bot/keyboards.js';
import { logger } from '../logger.js';

/**
 * Start the reminder cron job.
 * Runs every minute, queries tasks where remind_at <= now and is_done = false,
 * sends a Telegram message to each user, then clears the reminder.
 */
export function startReminderCron(bot: Bot<BotContext>): cron.ScheduledTask {
  return cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const dueTasks = await getDueReminders(now);

      if (dueTasks.length === 0) return;

      logger.info({ count: dueTasks.length }, 'Processing due reminders');

      for (const task of dueTasks) {
        try {
          const telegramId = task.users.telegram_id;
          const tz = task.users.timezone;

          let msg = `🔔 *Reminder:* ${escMd(task.title)}`;
          if (task.due_date) {
            msg += `\n📅 Due: ${formatDate(task.due_date, tz)}`;
          }

          await bot.api.sendMessage(telegramId, msg, {
            parse_mode: 'Markdown',
            reply_markup: snoozeKeyboard(task.id),
          });

          await clearReminder(task.id);
          logger.debug({ taskId: task.id, telegramId }, 'Reminder sent');
        } catch (err) {
          logger.error({ err, taskId: task.id }, 'Failed to send reminder');
        }
      }
    } catch (err) {
      logger.error({ err }, 'Reminder cron error');
    }
  });
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

function escMd(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}
