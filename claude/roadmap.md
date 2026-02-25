# ROADMAP — Personal Assistant Bot

> Modular AI assistant in messengers. Telegram first, platform-independent core.

---

## Project Philosophy

- **Strict but understanding**: bot excels at natural language, but if it doesn't understand — it says so honestly. No hallucinations, no made-up actions.
- **Modularity**: every feature is a separate "skill". Bot knows its boundaries and says "I can't do that yet".
- **Voice-first, text-equal**: voice is the primary input, but text is processed identically.
- **Platform-independent**: core logic doesn't depend on Telegram. Messenger is just an adapter.
- **Speed**: minimal latency between message and response.
- **No i18n files**: LLM handles all language output natively. User picks a language once, and every response comes back in that language via system prompt instruction.

---

## Tech Stack

| Component | Technology | Why |
|---|---|---|
| Runtime | Node.js + TypeScript | Dev speed, type safety |
| Telegram | grammY | Lightweight, TS-first, middleware |
| Database | Supabase (PostgreSQL) | Hosted, RLS, realtime |
| LLM | Anthropic Claude API | Best intent understanding, structured output |
| Voice | OpenAI Whisper API | Best multilingual transcription |
| Scheduler | node-cron | Reminders, digests |
| Deploy | Railway | Simple, auto-deploy |
| Vector search | pgvector (Supabase) | Future: semantic notes search |
| Queue (future) | BullMQ + Redis | Heavy tasks at scale |

---

## Milestone 0 — Skeleton & Deploy (~3-5 days)

> Bare minimum: bot runs, replies, is deployed.

- Project init: TypeScript, ESLint, Prettier
- Folder structure (vertical/feature-based architecture)
- Environment variables with validation
- grammY bot — echo mode
- Basic logging (pino)
- Dev mode: hot reload
- Dockerfile (with ffmpeg) + railway.toml
- Deploy to Railway
- CI: lint + typecheck on push

**Result**: bot is live, echoes messages, auto-deploys from main.

---

## Milestone 1 — Core Assistant (~2-3 weeks)

> Auth, onboarding, voice, LLM routing, chat, confirmations.

### Database & Auth
- Supabase connection
- `users` table (telegram_id, name, language, timezone, onboarding state, digest times)
- Auth middleware: find/create user, block if onboarding incomplete
- Track last_active_at

### Onboarding
- Step-by-step flow:
  1. Welcome + what the bot can do
  2. Language (inline keyboard, then ALL communication in that language via LLM)
  3. Name — how to address user
  4. Timezone (keyboard by region or geolocation suggestion)
  5. Digest times (morning/evening defaults)
  6. Mini tour with examples
- `/setup` to redo onboarding anytime

### Voice Messages
- Download .ogg via grammY → convert to mp3 (ffmpeg) → Whisper API
- Show transcription: "Heard: ..."
- Feed into same text pipeline

### LLM Intent Router
- Every message → Claude → structured JSON with intent, confidence, params
- Skill Registry: bot knows what skills are active, tells LLM
- If confidence low → "Didn't quite understand, did you mean...?"
- If skill doesn't exist → "I can't do that yet"
- If gibberish → "Can't parse this message"
- Context sent to LLM: name, language, timezone, current time, available skills, recent messages

### Confirmations
- Read operations → immediate response
- Create/Update → confirm with details
- Delete → confirm with warning
- Inline keyboard: [Confirm] [Cancel]
- Pending action with 5min TTL

### Chat History
- `messages` table, last 20 sent as LLM context
- Auto-cleanup older than 30 days

### Free Chat
- Intent `chat` → Claude responds freely within assistant role
- Contextual suggestions: if chat mentions a task/date → "Want me to create a task?"

### Help
- `/help` — all skills overview
- `/help <skill>` — specific skill help
- `/tour` — repeat onboarding mini-tour

**Result**: full chat bot with natural language understanding, voice, onboarding.

---

## Milestone 2 — Tasks & Reminders (~1-2 weeks)

> Tasks, recurring, reminders, daily digests.

- `tasks` table (title, description, due_date, remind_at, recurrence_rule, is_done)
- Natural language task creation: "remind me to call mom tomorrow at 3"
- Claude parses dates relative to user timezone
- Recurring tasks: daily, weekly, monthly, custom (RRULE format)
- Cron every minute — check and send reminders
- Snooze: [+15min] [+1hr] [Done]
- View, complete, edit, delete tasks
- **Daily digests**:
  - Morning: "Good morning, {name}! Here's your plan:" + tasks + (future: calendar)
  - Evening: "Today's summary:" + done/undone + "Tomorrow:" + upcoming
  - Claude generates digest text — brief and pleasant
  - On first task creation: suggest setting up digests

**Result**: full task system with reminders and daily reviews.

---

## Milestone 3 — Notes (~1-2 weeks)

> Notes with auto-tags, search.

- `notes` table (content, tags[], created_at)
- Natural language creation: "remember: pancake recipe — 2 eggs, flour, milk"
- Claude auto-generates 2-5 tags, normalized (lowercase, singular)
- Search by tags and content (PostgreSQL ILIKE)
- View, edit, delete

**Result**: smart notes with automatic organization.

---

## Milestone 4 — Google Calendar (~2-3 weeks)

> OAuth, read/create events, conflict detection.

### Single account
- OAuth2 flow: bot sends link → user authorizes → callback saves tokens
- Encrypted refresh_token storage
- Read events: "what's on my calendar tomorrow?"
- Create events: "schedule a meeting Wednesday at 2pm for an hour"
- Integration into digests
- Meeting reminders (15min before)
- Conflict detection when creating tasks/events

### Multiple accounts (separate iteration)
- Multiple OAuth tokens per user
- Aggregate events from all calendars
- Specify account when creating
- Source label in digests

**Result**: calendar integrated into daily routine.

---

## Milestone 5 — Gmail Integration (~2-3 weeks)

> Read, analyze, create tasks from emails.

- OAuth2 for Gmail (extend existing Google scope)
- Read inbox: "what's new in my email?"
- Claude summary of unread messages
- Search: "find the email from John about the contract"
- Create tasks from emails
- Multi-account support
- Integration into digests

**Result**: email under control without opening Gmail.

---

## Milestone 6 — Vector Notes (~2-3 weeks)

> Semantic search, RAG over notes.

- pgvector extension in Supabase
- Embed each note via OpenAI Embeddings
- Semantic search: "what did I write about productivity?"
- RAG: "summarize everything I noted about project X"
- Re-embed on note edit

**Result**: "second brain" — ask questions across all your notes.

---

## Milestone 7+ — Ambitious Features (by priority)

### 7.1 Subscription Manager
- Track subscriptions (Netflix, YouTube, etc.) with price, cycle, next payment
- Overview: "how much do I spend on subscriptions?"
- Renewal reminders

### 7.2 News Feed
- User specifies sources (RSS, sites) or topics
- Schedule: daily/weekly, what time
- Claude generates brief digest per source/topic

### 7.3 Finance Tracker
- Record expenses/income via chat: "spent €50 on lunch"
- Claude categorizes automatically
- Reports by period/category, budgets, warnings

### 7.4 Habit Tracker
- Create habits, daily check-in, streaks, stats
- Integrated into digests: morning reminder, evening check-in

### 7.5 Weekly/Monthly Review
- Auto-review: tasks, habits, finances, notes
- Claude generates insights: "You completed 80% of tasks but skipped meditation 3 times"

### 7.6 Health
- Sleep, medication, doctor visits tracking
- Medication reminders, wellness diary

### 7.7 Goals & Projects
- Long-term goals with milestones, progress bar
- Link tasks to goals, Claude helps decompose goals

### 7.8 Cross-Module Insights
- Claude sees data from all modules
- Proactive insights in digests

### 7.9 Admin Panel
- Broadcast messages to all users
- Usage statistics

---

## Future: Multi-Platform

### WhatsApp
- Adapter for WhatsApp Business API
- Same Core, different Transport layer

### Mobile App
- REST API for core functions
- Push notifications instead of messages

---

## Cross-Cutting Principles

1. **Modular**: Core ← Skills ← Transport
2. **Skill Registry**: each module registers its intents. Bot knows what it can do.
3. **Honest AI**: didn't understand → says so. Can't do → says so. No hallucinations.
4. **Confirm before mutate**: any data change requires confirmation.
5. **Context-aware**: LLM always receives user context + available skills.
6. **LLM-native language**: no i18n files. Claude outputs in user's language via prompt.
7. **Voice = Text**: single processing pipeline.
8. **Security**: encrypted tokens, user-isolated data, RLS.
9. **Speed**: caching, minimal round-trips.
10. **Testable**: mock LLM mode, unit tests per skill, integration tests.
