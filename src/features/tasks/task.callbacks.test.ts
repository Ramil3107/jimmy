import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./task.repo.js', () => ({
  getTaskById: vi.fn(),
  updateTask: vi.fn(),
  completeTask: vi.fn(),
}));

import { handleSnooze, handleSnoozeDone } from './task.callbacks.js';
import { getTaskById, updateTask, completeTask } from './task.repo.js';

function makeCtx() {
  return {
    user: { id: 'user-1', timezone: 'UTC' },
    answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
    editMessageText: vi.fn().mockResolvedValue(undefined),
  } as any;
}

function makeTask(overrides = {}) {
  return {
    id: 'task-1',
    user_id: 'user-1',
    title: 'Call mom',
    description: null,
    due_date: null,
    remind_at: '2026-03-14T14:00:00Z',
    is_done: false,
    completed_at: null,
    created_at: '2026-03-14T10:00:00Z',
    updated_at: '2026-03-14T10:00:00Z',
    ...overrides,
  };
}

describe('handleSnooze', () => {
  beforeEach(() => vi.clearAllMocks());

  it('snoozes a task by updating remind_at', async () => {
    const ctx = makeCtx();
    const task = makeTask();
    vi.mocked(getTaskById).mockResolvedValue(task);
    vi.mocked(updateTask).mockResolvedValue(task);

    const before = Date.now();
    await handleSnooze(ctx, 'task-1', 15);

    expect(updateTask).toHaveBeenCalledWith('task-1', {
      remind_at: expect.any(String),
    });

    // Verify the remind_at is approximately 15 minutes from now
    const callArg = vi.mocked(updateTask).mock.calls[0][1] as any;
    const newRemind = new Date(callArg.remind_at).getTime();
    expect(newRemind).toBeGreaterThanOrEqual(before + 15 * 60 * 1000 - 1000);
    expect(newRemind).toBeLessThanOrEqual(before + 15 * 60 * 1000 + 5000);

    expect(ctx.answerCallbackQuery).toHaveBeenCalledWith('⏰ Snoozed +15min');
    expect(ctx.editMessageText).toHaveBeenCalledWith(
      expect.stringContaining('Snoozed'),
      expect.anything(),
    );
  });

  it('shows 1hr label for 60 minute snooze', async () => {
    const ctx = makeCtx();
    vi.mocked(getTaskById).mockResolvedValue(makeTask());
    vi.mocked(updateTask).mockResolvedValue(makeTask());

    await handleSnooze(ctx, 'task-1', 60);

    expect(ctx.answerCallbackQuery).toHaveBeenCalledWith('⏰ Snoozed +1hr');
  });

  it('handles missing task', async () => {
    const ctx = makeCtx();
    vi.mocked(getTaskById).mockResolvedValue(null);

    await handleSnooze(ctx, 'task-999', 15);

    expect(ctx.answerCallbackQuery).toHaveBeenCalledWith('Task not found.');
    expect(updateTask).not.toHaveBeenCalled();
  });

  it('handles already-done task', async () => {
    const ctx = makeCtx();
    vi.mocked(getTaskById).mockResolvedValue(makeTask({ is_done: true }));

    await handleSnooze(ctx, 'task-1', 15);

    expect(ctx.answerCallbackQuery).toHaveBeenCalledWith('Task already completed.');
    expect(updateTask).not.toHaveBeenCalled();
  });
});

describe('handleSnoozeDone', () => {
  beforeEach(() => vi.clearAllMocks());

  it('marks task as complete', async () => {
    const ctx = makeCtx();
    const task = makeTask();
    vi.mocked(getTaskById).mockResolvedValue(task);
    vi.mocked(completeTask).mockResolvedValue({ ...task, is_done: true });

    await handleSnoozeDone(ctx, 'task-1');

    expect(completeTask).toHaveBeenCalledWith('task-1');
    expect(ctx.answerCallbackQuery).toHaveBeenCalledWith('✅ Done!');
    expect(ctx.editMessageText).toHaveBeenCalledWith(
      expect.stringContaining('Done'),
      expect.anything(),
    );
  });

  it('handles missing task', async () => {
    const ctx = makeCtx();
    vi.mocked(getTaskById).mockResolvedValue(null);

    await handleSnoozeDone(ctx, 'task-999');

    expect(ctx.answerCallbackQuery).toHaveBeenCalledWith('Task not found.');
    expect(completeTask).not.toHaveBeenCalled();
  });

  it('handles already-done task', async () => {
    const ctx = makeCtx();
    vi.mocked(getTaskById).mockResolvedValue(makeTask({ is_done: true }));

    await handleSnoozeDone(ctx, 'task-1');

    expect(ctx.answerCallbackQuery).toHaveBeenCalledWith('Already done!');
    expect(completeTask).not.toHaveBeenCalled();
  });
});
