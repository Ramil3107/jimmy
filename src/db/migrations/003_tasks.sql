-- 003_tasks.sql — Tasks table
-- Run this in Supabase SQL Editor

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  remind_at TIMESTAMPTZ,
  is_done BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookup by user (for listing tasks)
CREATE INDEX idx_tasks_user_id ON tasks(user_id);

-- Fast lookup for reminder cron (find due reminders)
CREATE INDEX idx_tasks_remind_at ON tasks(remind_at)
  WHERE remind_at IS NOT NULL AND is_done = FALSE;

-- Fast lookup for user's open tasks by due date
CREATE INDEX idx_tasks_user_due ON tasks(user_id, due_date)
  WHERE is_done = FALSE;

-- Auto-update updated_at (reuses function from 001_users.sql)
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tasks select" ON tasks FOR SELECT USING (true);
CREATE POLICY "Tasks insert" ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Tasks update" ON tasks FOR UPDATE USING (true);
CREATE POLICY "Tasks delete" ON tasks FOR DELETE USING (true);
