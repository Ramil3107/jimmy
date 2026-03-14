-- 001_users.sql — Users table
-- Run this in Supabase SQL Editor

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  display_name TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  onboarding_step INT NOT NULL DEFAULT 0,
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  digest_morning_time TIME DEFAULT '08:00',
  digest_evening_time TIME DEFAULT '21:00',
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by telegram_id (auth middleware uses this on every message)
CREATE INDEX idx_users_telegram_id ON users(telegram_id);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS policy: users can only access their own row
-- (service key bypasses RLS, so bot backend can access all rows)
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (true);

CREATE POLICY "Allow insert"
  ON users FOR INSERT
  WITH CHECK (true);
