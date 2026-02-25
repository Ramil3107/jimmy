# Tasks for User

> **Purpose**: This file tracks all actions YOU need to complete so Claude Code can continue building the project.
>
> **Your Role**: Complete these tasks, check them off, and let Claude know when done.
>
> **Claude's Role**: Claude will handle ALL the coding. You just need to set up accounts, get API keys, and provide configuration.

---

## Current Status

**Active Milestone**: M0 - Skeleton & Deploy
**Last Updated**: 2026-02-25

---

## 🔴 URGENT: Prerequisites for M0 (Required to Start)

These are needed before Claude can begin writing code:

### 1. Create Telegram Bot
- [ ] **Step 1**: Open Telegram and search for `@BotFather`
- [ ] **Step 2**: Send `/newbot` command
- [ ] **Step 3**: Choose a display name (e.g., "Jimmy Assistant")
- [ ] **Step 4**: Choose a username (must end in 'bot', e.g., "jimmy_personal_bot")
- [ ] **Step 5**: Copy the API token (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
- [ ] **Step 6**: Save this token — you'll add it to `.env` file later

**Why needed**: This is the bot that will run on Telegram and talk to users.

**Troubleshooting**:
- Username taken? Try adding numbers: `jimmy_personal_bot_2024`
- Lost the token? Send `/mybots` to BotFather → select your bot → API Token

---

### 2. Create GitHub Repository
- [ ] **Step 1**: Go to https://github.com/new
- [ ] **Step 2**: Repository name: `jimmy-assistant` (or your preferred name)
- [ ] **Step 3**: Set to **Private** (recommended for personal bot)
- [ ] **Step 4**: Do NOT initialize with README (we'll push existing code)
- [ ] **Step 5**: Click "Create repository"
- [ ] **Step 6**: Copy the repository URL (e.g., `https://github.com/yourusername/jimmy-assistant.git`)

**Why needed**: For version control and automatic deployment to Railway.

---

### 3. Create Railway Account
- [ ] **Step 1**: Go to https://railway.app/
- [ ] **Step 2**: Click "Start a New Project" or "Login"
- [ ] **Step 3**: Sign up with GitHub (recommended for easy deployment)
- [ ] **Step 4**: Verify your email if required
- [ ] **Step 5**: No need to create a project yet — Claude will guide you through deployment

**Why needed**: This will host your bot 24/7 in the cloud.

**Note**: Railway has a free tier with $5 credit/month. This bot should fit within free tier during development.

---

## 🟡 READY: For After Initial Code is Written

These will be needed after Claude writes the initial project code:

### 4. Initialize Git Repository (Local)
**Wait for**: Claude to create the project files first

When ready, Claude will provide exact commands like:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-url>
git push -u origin main
```

You'll just need to run these commands in your terminal.

---

### 5. Set Up Environment Variables
**Wait for**: Claude to create `.env.example` file

When ready, you'll:
- [ ] Copy `.env.example` to `.env`
- [ ] Fill in the values (Claude will provide a checklist)
- [ ] Never commit `.env` to Git (it's in `.gitignore`)

**Template** (will be provided by Claude):
```bash
BOT_TOKEN=<your-telegram-bot-token>
# ... more variables will be added
```

---

## 🟢 UPCOMING: For Milestone 1

These will be needed when we start building the core assistant features:

### 6. Create Supabase Account & Project
- [ ] Go to https://supabase.com/
- [ ] Sign up with GitHub
- [ ] Create a new project
- [ ] Copy project URL and API key
- [ ] Add to `.env` file

**Detailed instructions will be provided when M1 starts.**

---

### 7. Create Anthropic Account (Claude API)
- [ ] Go to https://console.anthropic.com/
- [ ] Sign up
- [ ] Add payment method (pay-as-you-go)
- [ ] Generate API key
- [ ] Add to `.env` file

**Cost estimate**: ~$0.01-0.05 per conversation during development with mock mode enabled most of the time.

**Detailed instructions will be provided when M1 starts.**

---

### 8. Create OpenAI Account (Whisper API)
- [ ] Go to https://platform.openai.com/
- [ ] Sign up
- [ ] Add payment method
- [ ] Generate API key
- [ ] Add to `.env` file

**Cost estimate**: ~$0.006 per minute of audio transcription.

**Detailed instructions will be provided when M1 starts.**

---

## 🔵 FUTURE: For Later Milestones

### Milestone 2 - Tasks & Reminders
- No additional user setup required (uses existing Supabase)

### Milestone 4 - Google Calendar
- [ ] Create Google Cloud Project
- [ ] Enable Google Calendar API
- [ ] Set up OAuth credentials
- [ ] Configure consent screen

**Detailed instructions will be provided when M4 starts.**

---

## ✅ Completed Tasks

None yet — project just starting!

---

## 📝 Notes

- **You don't need to write any code** — Claude handles all implementation
- **You just need to**: create accounts, get API keys, run provided commands
- **Check this file regularly** — Claude updates it whenever user action is needed
- **Ask questions** if any step is unclear

---

## 🆘 Need Help?

If you're stuck on any task:
1. Check the troubleshooting section under each task
2. Ask Claude for clarification or alternative approaches
3. Check the service's documentation (links provided in each section)

---

## Summary: What You Need Right Now

To get started with M0, complete tasks #1-3:
1. ✅ Create Telegram Bot → Get bot token
2. ✅ Create GitHub repository
3. ✅ Create Railway account

Once these are done, let Claude know and we can begin!
