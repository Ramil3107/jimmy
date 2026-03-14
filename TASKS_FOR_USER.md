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

## Phase 2 — Deploy to Railway 🚀 (CURRENT)

### Prerequisites
- [x] GitHub repo exists: `Ramil3107/jimmy`
- [ ] Push latest code to GitHub (I'll help with this)

### 1. Create a Railway Account
- [ ] Go to [railway.app](https://railway.app) and sign up (GitHub login recommended)
- [ ] You get $5/month free on the Hobby plan

### 2. Create a New Project
- [ ] Click **"New Project"** → **"Deploy from GitHub Repo"**
- [ ] Select `Ramil3107/jimmy`
- [ ] Railway will detect the Dockerfile and start building

### 3. Set Environment Variables
- [ ] In Railway dashboard, click on your service → **Variables** tab
- [ ] Add these variables (click **"New Variable"** for each):

```
BOT_TOKEN=<your telegram bot token>
SUPABASE_URL=<your supabase project URL>
SUPABASE_KEY=<your supabase anon key>
OPENAI_API_KEY=<your OpenAI API key>
MOCK_LLM=false
DEV_MODE=false
LOG_LEVEL=info
```

> ⚠️ **MOCK_LLM must be `false`** in production so the bot uses real OpenAI for intent routing.
> ⚠️ **DEV_MODE must be `false`** in production.
> 📝 Copy these values from your local `.env` file.

### 4. Deploy
- [ ] After setting variables, Railway will auto-redeploy
- [ ] Check the **Deployments** tab — wait for status to show **"Success"**
- [ ] Check **Logs** tab — you should see:
  ```
  Jimmy bot is running
  Reminder cron started (every minute)
  ```

### 5. Test the Bot
- [ ] Open Telegram, send a message to your bot
- [ ] Try: "remind me to test railway in 2 minutes"
- [ ] Verify: you get a confirmation, then a reminder 2 minutes later with snooze buttons

### Troubleshooting
- **Build fails**: Check Deployments → click the failed deploy → read the build logs
- **Bot doesn't respond**: Check Logs tab for errors. Most common: wrong BOT_TOKEN
- **"Invalid environment variables"**: You're missing a required env var — check the Variables tab
- **Reminders not firing**: Make sure MOCK_LLM=false so dates get parsed correctly

---

## Future Tasks

### Phase 3 — Notes (M3)
- Will be detailed when we start M3

### Phase 4 — Google Calendar (M4)
- Will need Google Cloud project + OAuth credentials
