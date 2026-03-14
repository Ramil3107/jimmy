export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  remind_at: string | null;
  is_done: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskData {
  user_id: string;
  title: string;
  description?: string;
  due_date?: string;
  remind_at?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  due_date?: string | null;
  remind_at?: string | null;
  is_done?: boolean;
  completed_at?: string | null;
}

/** Task with joined user info — used by reminder cron */
export interface TaskWithUser extends Task {
  users: {
    timezone: string;
    telegram_id: number;
    language: string;
    display_name: string | null;
  };
}
