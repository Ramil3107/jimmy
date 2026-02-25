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
- [ ] Create `src/index.ts` with `console.log("Bot starting...")`
- [ ] Verify: `npx tsx src/index.ts` prints message

### Step 0.2 — Tooling
- [ ] Install: `npm i -D eslint prettier eslint-config-prettier`
- [ ] Create `.eslintrc.json`, `.prettierrc`
- [ ] Create `.gitignore` (node_modules, dist, .env)
- [ ] Create `.env.example`:
  ```
  BOT_TOKEN=
  SUPABASE_URL=
  SUPABASE_KEY=
  ANTHROPIC_API_KEY=
  OPENAI_API_KEY=
  DEV_MODE=true
  MOCK_LLM=true
  LOG_LEVEL=debug
  ```
- [ ] Add scripts to package.json:
  ```json
  "dev": "tsx watch src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "lint": "eslint src/",
  "typecheck": "tsc --noEmit"
  ```

### Step 0.3 — Env Validation
- [ ] Install: `npm i zod dotenv`
- [ ] Create `src/config/env.ts`:
  - Define schema with zod (BOT_TOKEN required, DEV_MODE boolean, etc.)
  - Parse and export typed `env` object
  - Crash on startup if env invalid
- [ ] Verify: remove BOT_TOKEN from .env → app crashes with clear error

### Step 0.4 — Logger
- [ ] Install: `npm i pino pino-pretty`
- [ ] Create `src/core/logger.ts`:
  - pino instance, level from env
  - Pretty print in dev, JSON in prod
  - Redact sensitive fields (tokens, keys)
- [ ] Use in index.ts: `logger.info("Bot starting")`

### Step 0.5 — Echo Bot
- [ ] Install: `npm i grammy`
- [ ] Create `src/bot/bot.ts`:
  - Create bot instance with BOT_TOKEN
  - Echo handler: `bot.on("message:text", ctx => ctx.reply(ctx.message.text))`
  - Error handler with logging
  - Graceful shutdown (SIGTERM, SIGINT)
- [ ] Update `src/index.ts` to start bot
- [ ] Verify: send message in Telegram → bot echoes it back

### Step 0.6 — Deploy
- [ ] Create `Dockerfile`:
  ```dockerfile
  FROM node:20-slim AS builder
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci
  COPY . .
  RUN npm run build

  FROM node:20-slim
  RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci --production
  COPY --from=builder /app/dist ./dist
  CMD ["node", "dist/index.js"]
  ```
- [ ] Create `railway.toml`
- [ ] Push to GitHub, connect Railway, deploy
- [ ] Verify: echo bot works in production

### Milestone 0 Checkpoint
- [ ] `npm run dev` → bot runs locally, echoes messages
- [ ] `npm run lint` + `npm run typecheck` → no errors
- [ ] Bot deployed on Railway, working in prod

---

## Milestone 1 — Core Assistant

### Step 1.1 — Supabase Connection
- [ ] Create Supabase project at supabase.com
- [ ] Install: `npm i @supabase/supabase-js`
- [ ] Create `src/db/client.ts`:
  - Initialize Supabase client with env vars
  - Export typed client
- [ ] Add health check on startup: `supabase.from('_health').select('1')` or equivalent
- [ ] Verify: app starts without DB errors in logs

### Step 1.2 — Users Table
- [ ] Create `src/db/migrations/001_users.sql` (see MILESTONE_1.md for schema)
- [ ] Run migration in Supabase SQL editor (or create a migrate script)
- [ ] Create `src/features/users/user.types.ts` — User type
- [ ] Create `src/features/users/user.repo.ts`:
  - `create(data)` → User
  - `getByTelegramId(telegramId)` → User | null
  - `update(id, data)` → User
- [ ] Verify: manually insert a user, query it back

### Step 1.3 — Auth Middleware
- [ ] Create `src/bot/middleware/auth.ts`:
  - Extract telegram_id from `ctx.from.id`
  - Call `userRepo.getByTelegramId()` → if null, create
  - Set `ctx.user = user`
  - Update `last_active_at`
- [ ] Create `src/bot/context.ts` — extended BotContext type with `user` field
- [ ] Register middleware in bot.ts
- [ ] Remove echo handler
- [ ] Verify: send message → check Supabase, user row exists

### Step 1.4 — Onboarding Guard
- [ ] Create `src/bot/middleware/onboarding-guard.ts`:
  - If `ctx.user.onboarding_complete === false` → call onboarding handler, return
  - Otherwise → next()
- [ ] Register after auth middleware
- [ ] Verify: new user sends message → gets onboarding (not echo)

### Step 1.5 — Onboarding Flow
- [ ] Create `src/features/onboarding/onboarding.handler.ts`
- [ ] Create `src/bot/keyboards.ts` — reusable inline keyboard builders
- [ ] Implement steps 0-5 (see MILESTONE_1.md Phase 2)
- [ ] Each step: validate input → save to DB → advance step → show next
- [ ] Handle unexpected input: re-ask the current step politely
- [ ] On completion: set `onboarding_complete = true`
- [ ] Verify: go through full onboarding, check all fields in DB

### Step 1.6 — Voice Processing
- [ ] Install: `npm i fluent-ffmpeg @types/fluent-ffmpeg openai`
- [ ] Create `src/features/voice/transcriber.ts`:
  - `transcribe(oggBuffer: Buffer) → string`
  - Convert ogg → mp3 via ffmpeg (temp files, cleanup after)
  - Send to Whisper API
  - Return transcription text
- [ ] Create `src/features/voice/voice.handler.ts`:
  - Download file via grammY
  - Call transcriber
  - Reply with "🎤 Heard: ..."
  - Pass text to main handler
- [ ] Register voice handler in bot.ts
- [ ] Verify: send voice message → bot shows transcription

### Step 1.7 — LLM Router (basic)
- [ ] Install: `npm i @anthropic-ai/sdk`
- [ ] Create `src/core/llm/types.ts` — IntentResult interface
- [ ] Create `src/core/llm/prompts/router.v1.ts` — system prompt builder
- [ ] Create `src/core/llm/router.ts`:
  - `routeMessage(text, context) → IntentResult`
  - Send to Claude with system prompt + user message
  - Parse JSON response
  - Handle parse errors gracefully
- [ ] Verify: test with a few messages, check JSON output in logs

### Step 1.8 — Mock LLM Router
- [ ] Create `src/core/llm/mock-router.ts`:
  - Pattern matching: "help" → help, anything else → chat
  - Returns same IntentResult shape
- [ ] In router.ts: if `env.MOCK_LLM` → use mock router
- [ ] Verify: `MOCK_LLM=true` → bot responds without API calls

### Step 1.9 — Skill Registry
- [ ] Create `src/core/skills/types.ts` — Skill interface
- [ ] Create `src/core/skills/registry.ts`:
  - `register(skill)`, `getByIntent(intent)`, `getDescriptions()`
- [ ] Create `src/features/chat/chat.skill.ts`:
  - Intent: "chat"
  - Handler: pass to Claude for free-form response
- [ ] Create `src/features/help/help.skill.ts`:
  - Intent: "help"
  - Handler: list skills from registry
- [ ] Register skills on startup
- [ ] Verify: send "help" → get skill list, send "hello" → get chat response

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
- [ ] Install: `npm i -D vitest`
- [ ] Create `vitest.config.ts`
- [ ] Test: user repository (mock Supabase client)
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
