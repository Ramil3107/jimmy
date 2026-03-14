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
- [ ] Create `src/bot/handlers/message.handler.ts`:
  - Text comes in (from text or voice pipeline)
  - Get recent messages for context
  - Call LLM router with text + context
  - Find skill by intent from registry
  - Execute skill handler
  - Save user + assistant messages to history
- [ ] Wire everything together in bot.ts
- [ ] Verify: full flow works — message → intent → skill → response

### Step 1.11 — Confirmation System
- [ ] Create `src/core/session/pending-actions.ts`:
  - In-memory Map: `userId → { action, createdAt }`
  - `set(userId, action)` → returns actionId
  - `get(userId, actionId)` → PendingAction | null (check TTL)
  - `confirm(userId, actionId)` → execute and remove
  - `cancel(userId, actionId)` → remove
- [ ] Create `src/bot/handlers/callback.handler.ts`:
  - Handle confirm/cancel callback queries
- [ ] Verify: (will be fully tested when tasks are added in M2)

### Step 1.12 — Messages Table & History
- [ ] Create `src/db/migrations/002_messages.sql`
- [ ] Create `src/features/messages/message.repo.ts`:
  - `save(userId, role, content, intent)`
  - `getRecent(userId, limit=20)`
- [ ] Integrate into message handler: save both user and assistant messages
- [ ] Verify: check messages table after conversation

### Step 1.13 — Rate Limiter
- [ ] Create `src/bot/middleware/rate-limit.ts`:
  - In-memory counter per user
  - Max 30 messages/minute
  - Reply with "slow down" if exceeded
- [ ] Register in middleware pipeline
- [ ] Verify: spam messages → get rate limit response

### Step 1.14 — Tests
- [x] Install: `npm i -D vitest`
- [x] Create `vitest.config.ts`
- [x] Test: user repository (mock Supabase client)
- [ ] Test: pending actions (set, get, TTL, confirm, cancel)
- [ ] Test: skill registry (register, find, list)
- [ ] Create `scripts/test-llm.ts` — intent routing quality tests
- [ ] Add script: `"test": "vitest run"`

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

> Will be detailed after Milestone 1 is complete.
> High-level steps: tasks table → task skill (CRUD) → recurring tasks → cron reminders → snooze → digests.

## Milestone 3 — Notes

> Will be detailed after Milestone 2 is complete.
> High-level steps: notes table → note skill (CRUD) → auto-tags via LLM → search.

## Milestone 4+ — See ROADMAP.md
