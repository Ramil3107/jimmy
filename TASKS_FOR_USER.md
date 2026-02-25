# TASKS_FOR_USER.md — Action Items

> Things you need to do before the bot can run. Complete these in order.

---

## Phase 1.1 — Supabase Setup

### 1. Create a Telegram Bot
- [x] Open Telegram, find `@BotFather`
- [x] Send `/newbot`, follow prompts, get your **bot token**
- [x] Save the token — you'll need it for `.env`

### 2. Create a Supabase Project
- [x] Go to [supabase.com](https://supabase.com) and sign up / log in
- [x] Click **New Project**, give it a name (e.g. `jimmy`)
- [x] Wait for the project to provision
- [x] Go to **Settings → API**:
- [x] Copy the **Project URL** → this is your `SUPABASE_URL`
- [x] Copy the **anon/public key** → this is your `SUPABASE_KEY`

### 3. Create your `.env` file
- [x] Copy `.env.example` to `.env` in the project root
- [x] Fill in the values:
```
BOT_TOKEN=<your telegram bot token>
SUPABASE_URL=<your supabase project URL>
SUPABASE_KEY=<your supabase anon key>
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
DEV_MODE=true
MOCK_LLM=true
LOG_LEVEL=debug
```

### 4. Enable Row Level Security (RLS)
- [x] In Supabase dashboard, this is enabled by default on new tables
- [x] We'll configure policies when we create tables (next step)

### 5. Test the connection
- [x] Run `npm run dev` — should see:
  - `Database connection verified`
  - `Jimmy bot is running`
- [x] Send a message to your bot in Telegram — it should echo it back

---

> Once these are done, tell me and we'll move to Phase 1.2 (Users table).
