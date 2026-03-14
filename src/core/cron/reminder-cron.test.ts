import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing
vi.mock('../../features/tasks/task.repo.js', () => ({
  getDueReminders: vi.fn(),
  clearReminder: vi.fn(),
}));

vi.mock('node-cron', () => ({
  default: {
    schedule: vi.fn((pattern: string, callback: () => void) => {
      // Store the callback so tests can invoke it
      (vi.mocked as any)._cronCallback = callback;
      return { stop: vi.fn() };
    }),
  },
}));

import { startReminderCron } from './reminder-cron.js';
import { getDueReminders, clearReminder } from '../../features/tasks/task.repo.js';
import cron from 'node-cron';

function makeFakeBot() {
  return {
    api: {
      sendMessage: vi.fn().mockResolvedValue({}),
    },
  } as any;
}

function makeFakeTaskWithUser(overrides = {}) {
  return {
    id: 'task-1',
    user_id: 'user-1',
    title: 'Call mom',
    description: null,
    due_date: '2026-03-14T15:00:00Z',
    remind_at: '2026-03-14T14:45:00Z',
    is_done: false,
    completed_at: null,
    created_at: '2026-03-14T10:00:00Z',
    updated_at: '2026-03-14T10:00:00Z',
    users: {
      timezone: 'Europe/Lisbon',
      telegram_id: 12345,
      language: 'en',
      display_name: 'Ramil',
    },
    ...overrides,
  };
}

describe('reminder-cron', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('schedules a cron job running every minute', () => {
    const bot = makeFakeBot();
    startReminderCron(bot);
    expect(cron.schedule).toHaveBeenCalledWith('* * * * *', expect.any(Function));
  });

  it('sends reminder messages for due tasks and clears remind_at', async () => {
    const bot = makeFakeBot();
    const task = makeFakeTaskWithUser();
    vi.mocked(getDueReminders).mockResolvedValue([task]);
    vi.mocked(clearReminder).mockResolvedValue(undefined);

    startReminderCron(bot);

    // Get the callback from the mock and invoke it
    const callback = vi.mocked(cron.schedule).mock.calls[0][1] as () => Promise<void>;
    await callback();

    expect(getDueReminders).toHaveBeenCalledWith(expect.any(Date));
    expect(bot.api.sendMessage).toHaveBeenCalledWith(
      12345,
      expect.stringContaining('Call mom'),
      expect.objectContaining({
        parse_mode: 'Markdown',
        reply_markup: expect.anything(),
      }),
    );
    expect(clearReminder).toHaveBeenCalledWith('task-1');
  });

  it('does nothing when no tasks are due', async () => {
    const bot = makeFakeBot();
    vi.mocked(getDueReminders).mockResolvedValue([]);

    startReminderCron(bot);
    const callback = vi.mocked(cron.schedule).mock.calls[0][1] as () => Promise<void>;
    await callback();

    expect(bot.api.sendMessage).not.toHaveBeenCalled();
    expect(clearReminder).not.toHaveBeenCalled();
  });

  it('continues sending other reminders if one fails', async () => {
    const bot = makeFakeBot();
    const task1 = makeFakeTaskWithUser({ id: 'task-1', users: { timezone: 'UTC', telegram_id: 111, language: 'en', display_name: null } });
    const task2 = makeFakeTaskWithUser({ id: 'task-2', users: { timezone: 'UTC', telegram_id: 222, language: 'en', display_name: null } });
    vi.mocked(getDueReminders).mockResolvedValue([task1, task2]);
    vi.mocked(clearReminder).mockResolvedValue(undefined);

    // First call fails, second succeeds
    bot.api.sendMessage
      .mockRejectedValueOnce(new Error('Chat not found'))
      .mockResolvedValueOnce({});

    startReminderCron(bot);
    const callback = vi.mocked(cron.schedule).mock.calls[0][1] as () => Promise<void>;
    await callback();

    // Should still try the second one
    expect(bot.api.sendMessage).toHaveBeenCalledTimes(2);
    // Only the second should be cleared
    expect(clearReminder).toHaveBeenCalledTimes(1);
    expect(clearReminder).toHaveBeenCalledWith('task-2');
  });
});
