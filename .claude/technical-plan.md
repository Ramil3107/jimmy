# TECHNICAL_PLAN — Step-by-Step Implementation

> Concrete steps for each milestone. This is the file you work through with Claude Code.
> Each step is small, testable, and builds on the previous one.

---

## Milestone 0 — Skeleton & Deploy

### Step 0.1 — Project Init
```bash
mkdir assistant-bot && cd assistant-bot
npm init -y
npm i typescript @types/node tsx
npx tsc --init  # strict: true, outDir: dist, rootDir: src
```
- [x] Create `src/index.ts` with `console.log("Bot starting...")`
- [x] Verify: `npx tsx src/index.ts` prints message

### Step 0.2 — Tooling
- [x] Create `.gitignore` (node_modules, dist, .env)
- [x] Create `.env.example`
- [x] Add scripts to package.json (dev, build, start, typecheck)
> Note: Skipped ESLint/Prettier for now — can add later.

### Step 0.3 — Env Validation
- [x] Install: `npm i zod dotenv`
- [x] Create `src/config/env.ts` with zod schema
- [x] Crash on startup if env invalid

### Step 0.4 — Logger
- [x] Install: `npm i pino pino-pretty`
- [x] Create `src/core/logger.ts` (pretty in dev, JSON in prod, redact secrets)
- [x] Use in index.ts: `logger.info("Bot starting")`

### Step 0.5 — Echo Bot
- [x] Install: `npm i grammy`
- [x] Create `src/bot/bot.ts` (echo handler, error handler, graceful shutdown)
- [x] Update `src/index.ts` to start bot
- [x] Verify: send message in Telegram → bot echoes it back

### Step 0.6 — Deploy
- [x] Create `Dockerfile`
- [ ] Create `railway.toml`
- [ ] Push to GitHub, connect Railway, deploy
- [ ] Verify: echo bot works in production
> Note: Deployment deferred — focusing on M1 features first.

### Milestone 0 Checkpoint
- [x] `npm run dev` → bot runs locally, echoes messages
- [x] `npm run typecheck` → no errors
- [ ] Bot deployed on Railway, working in prod

---

## Milestone 1 — Core Assistant

### Step 1.1 — Supabase Connection
- [x] Create Supabase project at supabase.com
- [x] Install: `npm i @supabase/supabase-js`
- [x] Create `src/db/client.ts` (Supabase client + health check via auth.getSession)
- [x] Verify: app starts without DB errors in logs

### Step 1.2 — Users Table
- [x] Create `src/db/migrations/001_users.sql` (see MILESTONE_1.md for schema)
- [x] Run migration in Supabase SQL editor
- [x] Create `src/features/users/user.types.ts` — User type
- [x] Create `src/features/users/user.repo.ts`:
  - `create(data)` → User
  - `getByTelegramId(telegramId)` → User | null
  - `update(id, data)` → User
- [ ] Verify: manually insert a user, query it back

### Step 1.3 — Auth Middleware
- [x] Create `src/bot/middleware/auth.ts`:
  - Extract telegram_id from `ctx.from.id`
  - Call `userRepo.getByTelegramId()` → if null, create
  - Set `ctx.user = user`
  - Update `last_active_at`
- [x] Create `src/bot/context.ts` — extended BotContext type with `user` field
- [x] Register middleware in bot.ts
- [x] Remove echo handler
- [x] Verify: send message → check Supabase, user row exists

### Step 1.4 — Onboarding Guard
- [x] Create `src/bot/middleware/onboarding-guard.ts`:
  - If `ctx.user.onboarding_complete === false` → call onboarding handler, return
  - Otherwise → next()
- [x] Register after auth middleware
- [x] Verify: new user sends message → gets onboarding (not echo)

### Step 1.5 — Onboarding Flow
- [x] Create `src/features/onboarding/onboarding.handler.ts`
- [x] Create `src/bot/keyboards.ts` — reusable inline keyboard builders
- [x] Implement steps 0-6 (welcome → language → name → timezone → morning digest → evening digest → tour)
- [x] Each step: validate input → save to DB → advance step → show next
- [x] Handle unexpected input: re-ask the current step politely
- [x] On completion: set `onboarding_complete = true`
- [x] Verify: go through full onboarding, check all fields in DB

### Step 1.6 — Voice Processing
- [x] Install: `npm i openai` (Whisper accepts .ogg directly — no ffmpeg needed)
- [x] Create `src/features/voice/transcriber.ts`:
  - `transcribe(audioBuffer: Buffer, language?) → string`
  - Send .ogg directly to Whisper API
  - Return transcription text
- [x] Create `src/features/voice/voice.handler.ts`:
  - Download file via grammY
  - Call transcriber
  - Reply with "🎤 Heard: ..."
  - Pass text to main handler (TODO: Step 1.10)
- [x] Register voice handler in bot.ts
- [x] Verify: send voice message → bot shows transcription

### Step 1.7 — LLM Router (basic)
- [x] Create `src/core/llm/types.ts` — IntentResult, RoutingContext, SkillDescription
- [x] Create `src/core/llm/prompts/router.v1.ts` — system prompt builder
- [x] Create `src/core/llm/router.ts`:
  - `routeMessage(text, context) → IntentResult`
  - Send to OpenAI GPT-4o-mini with system prompt + user message
  - Parse JSON response (using json_object response format)
  - Handle parse errors gracefully
- [ ] Verify: test with a few messages, check JSON output in logs (will test after Step 1.10)

### Step 1.8 — Mock LLM Router
- [x] Create `src/core/llm/mock-router.ts`:
  - Pattern matching: help, tasks, notes, calendar → correct intents
  - Anything else → chat
  - Returns same IntentResult shape
- [x] Create `src/core/llm/index.ts` — unified entry point, picks real/mock based on env
- [x] Verify: `MOCK_LLM=true` → bot responds without API calls

### Step 1.9 — Skill Registry
- [x] Create `src/core/skills/types.ts` — Skill interface
- [x] Create `src/core/skills/registry.ts`:
  - `registerSkill(skill)`, `getSkillByIntent(intent)`, `getSkillDescriptions()`, `getAllSkills()`
- [x] Create `src/features/chat/chat.skill.ts`:
  - Intent: "chat"
  - Handler: no-op (LLM response_text used directly)
- [x] Create `src/features/help/help.skill.ts`:
  - Intent: "help"
  - Handler: list skills from registry
- [ ] Register skills on startup (Step 1.10)
- [ ] Verify: send "help" → get skill list, send "hello" → get chat response (Step 1.10)

### Step 1.10 — Main Message Handler
- [x] Create `src/bot/handlers/message.handler.ts`:
  - Text comes in (from text or voice pipeline)
  - Build RoutingContext with user info + skill descriptions
  - Call LLM router with text + context
  - Find skill by intent from registry
  - Execute skill handler
  - Confidence thresholds (< 0.3 fallback, < 0.6 clarify)
- [x] Wire everything together in bot.ts (skills registered, voice→handler, text→handler)
- [x] Verify: full flow works — message → intent → skill → response

### Step 1.11 — Confirmation System
- [x] Create `src/core/session/pending-actions.ts`:
  - In-memory Map with 5min TTL
  - `setPendingAction(userId, intent, params, description)` → actionId
  - `getPendingAction(actionId)` → PendingAction | null (checks TTL)
  - `confirmPendingAction(actionId)` → executes and removes
  - `cancelPendingAction(actionId)` → removes
  - One pending action per user (new replaces old)
- [x] Create `src/bot/handlers/callback.handler.ts`:
  - Handle confirm/cancel callback queries
  - Wired into bot.ts callback router
- [x] Verify: unit tests pass (full integration test in M2 with tasks)

### Step 1.12 — Messages Table & History
- [x] Create `src/db/migrations/002_messages.sql`
- [x] Create `src/features/messages/message.types.ts` and `message.repo.ts`:
  - `saveMessage(userId, role, content, intent)`
  - `getRecentMessages(userId, limit=20)` — returns chronological order
- [x] Integrate into message handler: save user + assistant messages, load history for LLM context
- [x] Run migration in Supabase SQL editor
- [ ] Verify: check messages table after conversation

### Step 1.13 — Rate Limiter
- [x] Create `src/bot/middleware/rate-limit.ts`:
  - In-memory counter per user with 1min window
  - Max 30 messages/minute
  - Reply with "too many messages" if exceeded
- [x] Register in middleware pipeline (before auth)
- [x] Tests pass

### Step 1.14 — Tests
- [x] Install: `npm i -D vitest`
- [x] Create `vitest.config.ts`
- [x] Test: user repository (mock Supabase client)
- [x] Test: pending actions (set, get, TTL, confirm, cancel)
- [x] Test: skill registry (register, find, list)
- [ ] Create `scripts/test-llm.ts` — intent routing quality tests (deferred to when LLM is actively used)
- [x] Add script: `"test": "vitest run"`

### Milestone 1 Checkpoint
- [ ] Full onboarding works (language, name, timezone, digests)
- [ ] Voice transcription works
- [ ] LLM routing works (chat, help, unknown/unsupported)
- [ ] Chat history preserved and used as context
- [ ] Bot responds in user's chosen language
- [ ] Mock LLM mode works for dev
- [ ] Tests pass
- [ ] Deployed on Railway

---

## Milestone 2 — Tasks & Reminders

### Step 2.1 — Tasks Table Migration
- [x] Create `src/db/migrations/003_tasks.sql` (tasks table with indexes, RLS, trigger)
- [x] Run migration in Supabase SQL editor

### Step 2.2 — Task Types & Repository
- [x] Create `src/features/tasks/task.types.ts` — Task, CreateTaskData, UpdateTaskData, TaskWithUser
- [x] Create `src/features/tasks/task.repo.ts` — CRUD: create, getById, getByUser, update, delete, complete, getDueReminders, clearReminder
- [x] Create `src/features/tasks/task.repo.test.ts`

### Step 2.3 — Task Skill + LLM Prompt Update
- [x] Add `mutatesData` flag to Skill interface
- [x] Update message handler to skip response_text for mutation skills, pass intent in params
- [x] Update callback handler to pass `{ ...params, confirmed: true }`
- [x] Create `src/features/tasks/task.skill.ts` — all intents: create_task, list_tasks, complete_task, edit_task, delete_task
- [x] Update LLM prompt with task param extraction guidance (title, due_date, remind_at as ISO strings)
- [x] Update mock router with task patterns + params
- [x] Register task skill in bot.ts

### Step 2.4 — Create Task Flow (End-to-End)
- [x] Implement create_task handler: LLM extracts params → show confirmation → user confirms → save to DB
- [x] Format confirmation with title, due date in user timezone
- [x] List, complete, edit, delete all implemented with confirmation flow
- [ ] Verify: "remind me to call mom tomorrow at 3pm" → confirm → task in DB

### Step 2.5 — List Tasks
- [ ] Implement list_tasks handler: show numbered list of open tasks with due dates
- [ ] No confirmation needed (read operation)
- [ ] Handle empty state: "You have no tasks yet"

### Step 2.6 — Complete Task
- [ ] Implement complete_task handler: match user description to task by title substring
- [ ] Handle: exact match → confirm, multiple matches → ask to pick, no match → say not found
- [ ] Confirmation required

### Step 2.7 — Edit & Delete Task
- [ ] Implement edit_task handler: same matching, update fields
- [ ] Implement delete_task handler: same matching, confirmation with warning
- [ ] Tests for both

### Step 2.8 — Reminder Cron Job
- [ ] Install: `npm i node-cron @types/node-cron`
- [ ] Create `src/core/cron/reminder-cron.ts`: every minute, query due reminders, send messages
- [ ] Snooze keyboard: [+15min] [+1hr] [Done]
- [ ] Wire into `src/index.ts`
- [ ] Tests

### Step 2.9 — Snooze & Task Done Callbacks
- [ ] Add `snoozeKeyboard()` to keyboards.ts
- [ ] Create `src/features/tasks/task.callbacks.ts` — handleSnooze, handleTaskDone
- [ ] Wire callbacks in bot.ts
- [ ] Tests

### Step 2.10 — Polish & Help Update
- [ ] Update help skill with task capabilities
- [ ] Update mock router for all task patterns
- [ ] Update CONTEXT.md and planning docs

### Step 2.11 — Daily Digests (defer to v2)
- [ ] Morning/evening digest cron (can be added later)

## Milestone 3 — Notes

> Will be detailed after Milestone 2 is complete.
> High-level steps: notes table → note skill (CRUD) → auto-tags via LLM → search.

## Milestone 4+ — See ROADMAP.md
