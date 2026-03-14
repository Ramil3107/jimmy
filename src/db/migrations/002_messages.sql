-- 002_messages.sql — Chat history table
-- Run this in Supabase SQL Editor

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  intent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fetching recent messages per user
CREATE INDEX idx_messages_user_created ON messages(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Messages belong to user"
  ON messages FOR SELECT
  USING (true);

CREATE POLICY "Allow insert messages"
  ON messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow delete messages"
  ON messages FOR DELETE
  USING (true);
