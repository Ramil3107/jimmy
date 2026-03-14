# TASKS_FOR_USER.md — Action Items

> Things you need to do before the bot can run. Complete these in order.

---

## Phase 1.1 — Supabase Setup ✅ COMPLETE

### 1. Create a Telegram Bot ✅
- [x] Open Telegram, find `@BotFather`
- [x] Send `/newbot`, follow prompts, get your **bot token**
- [x] Save the token — you'll need it for `.env`

### 2. Create a Supabase Project ✅
- [x] Go to [supabase.com](https://supabase.com) and sign up / log in
- [x] Click **New Project**, give it a name (e.g. `jimmy`)
- [x] Wait for the project to provision
- [x] Go to **Settings → API**:
- [x] Copy the **Project URL** → this is your `SUPABASE_URL`
- [x] Copy the **anon/public key** → this is your `SUPABASE_KEY`

### 3. Create your `.env` file ✅
- [x] Copy `.env.example` to `.env` in the project root
- [x] Fill in the values (BOT_TOKEN, SUPABASE_URL, SUPABASE_KEY)

### 4. Enable Row Level Security (RLS) ✅
- [x] Enabled by default on new tables in Supabase

### 5. Test the connection ✅
- [x] Run `npm run dev` — bot starts and echoes messages

---

## Phase 1.2 — Users Table (NEXT)

### 1. Run the Users Migration
- [ ] I will create the SQL migration file at `src/db/migrations/001_users.sql`
- [ ] Open your Supabase dashboard → **SQL Editor**
- [ ] Copy-paste the contents of `001_users.sql` and run it
- [ ] Verify: go to **Table Editor** → you should see a `users` table

> **Why**: The bot needs a users table to store Telegram users, their language, timezone, and onboarding state.

---

## Future Tasks (will be detailed when needed)

### Phase 1.6 — Voice Processing
- [ ] Get an **OpenAI API key** from [platform.openai.com](https://platform.openai.com)
- [ ] Add it to `.env` as `OPENAI_API_KEY=sk-...`

### Phase 1.7 — LLM Router
- [ ] Get an **Anthropic API key** from [console.anthropic.com](https://console.anthropic.com)
- [ ] Add it to `.env` as `ANTHROPIC_API_KEY=sk-ant-...`

### Deployment (when ready)
- [ ] Create a [Railway](https://railway.app) account
- [ ] Connect your GitHub repo
- [ ] Set environment variables in Railway dashboard
