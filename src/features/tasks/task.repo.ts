import { supabase } from '../../db/client.js';
import type { Task, CreateTaskData, UpdateTaskData, TaskWithUser } from './task.types.js';

export async function createTask(data: CreateTaskData): Promise<Task> {
  const { data: task, error } = await supabase
    .from('tasks')
    .insert(data)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create task: ${error.message}`);
  }

  return task as Task;
}

export async function getTaskById(id: string): Promise<Task | null> {
  const { data: task, error } = await supabase
    .from('tasks')
    .select()
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to get task: ${error.message}`);
  }

  return task as Task;
}

export async function getTasksByUser(
  userId: string,
  options: { includeDone?: boolean; limit?: number } = {},
): Promise<Task[]> {
  let query = supabase
    .from('tasks')
    .select()
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (!options.includeDone) {
    query = query.eq('is_done', false);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get tasks: ${error.message}`);
  }

  return (data as Task[]) || [];
}

export async function updateTask(id: string, data: UpdateTaskData): Promise<Task> {
  const { data: task, error } = await supabase
    .from('tasks')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update task: ${error.message}`);
  }

  return task as Task;
}

export async function completeTask(id: string): Promise<Task> {
  return updateTask(id, {
    is_done: true,
    completed_at: new Date().toISOString(),
  });
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete task: ${error.message}`);
  }
}

/** Find tasks with due reminders — joins with users for telegram_id and timezone */
export async function getDueReminders(now: Date): Promise<TaskWithUser[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, users!inner(timezone, telegram_id, language, display_name)')
    .lte('remind_at', now.toISOString())
    .eq('is_done', false);

  if (error) {
    throw new Error(`Failed to get due reminders: ${error.message}`);
  }

  return (data as TaskWithUser[]) || [];
}

/** Clear remind_at after reminder is sent */
export async function clearReminder(id: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ remind_at: null })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to clear reminder: ${error.message}`);
  }
}
