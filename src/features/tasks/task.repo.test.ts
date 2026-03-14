import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFrom = vi.hoisted(() => vi.fn());

vi.mock('../../db/client.js', () => ({
  supabase: { from: mockFrom },
}));

import {
  createTask,
  getTaskById,
  getTasksByUser,
  updateTask,
  completeTask,
  deleteTask,
  getDueReminders,
  clearReminder,
} from './task.repo.js';
import type { Task } from './task.types.js';

const fakeTask: Task = {
  id: 'task-uuid-1',
  user_id: 'user-uuid-1',
  title: 'Call mom',
  description: null,
  due_date: '2026-03-15T15:00:00Z',
  remind_at: '2026-03-15T14:45:00Z',
  is_done: false,
  completed_at: null,
  created_at: '2026-03-14T12:00:00Z',
  updated_at: '2026-03-14T12:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createTask', () => {
  it('creates and returns a task', async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: fakeTask, error: null }),
        }),
      }),
    });

    const result = await createTask({
      user_id: 'user-uuid-1',
      title: 'Call mom',
      due_date: '2026-03-15T15:00:00Z',
    });

    expect(mockFrom).toHaveBeenCalledWith('tasks');
    expect(result).toEqual(fakeTask);
  });

  it('throws on error', async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'insert failed' } }),
        }),
      }),
    });

    await expect(createTask({ user_id: 'u1', title: 'test' })).rejects.toThrow('Failed to create task');
  });
});

describe('getTaskById', () => {
  it('returns task when found', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: fakeTask, error: null }),
        }),
      }),
    });

    const result = await getTaskById('task-uuid-1');
    expect(result).toEqual(fakeTask);
  });

  it('returns null when not found', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'no rows' } }),
        }),
      }),
    });

    const result = await getTaskById('nonexistent');
    expect(result).toBeNull();
  });
});

describe('getTasksByUser', () => {
  it('returns open tasks for user', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: undefined as any,
    };
    // Make it resolve when awaited
    mockQuery.order = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: [fakeTask], error: null }),
    });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue(mockQuery),
      }),
    });

    const result = await getTasksByUser('user-uuid-1');
    expect(result).toEqual([fakeTask]);
  });
});

describe('completeTask', () => {
  it('marks task as done', async () => {
    const completed = { ...fakeTask, is_done: true, completed_at: '2026-03-14T12:00:00Z' };
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: completed, error: null }),
          }),
        }),
      }),
    });

    const result = await completeTask('task-uuid-1');
    expect(result.is_done).toBe(true);
  });
});

describe('deleteTask', () => {
  it('deletes without error', async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    await expect(deleteTask('task-uuid-1')).resolves.toBeUndefined();
  });

  it('throws on error', async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: 'delete failed' } }),
      }),
    });

    await expect(deleteTask('task-uuid-1')).rejects.toThrow('Failed to delete task');
  });
});

describe('clearReminder', () => {
  it('clears remind_at', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    await expect(clearReminder('task-uuid-1')).resolves.toBeUndefined();
  });
});
