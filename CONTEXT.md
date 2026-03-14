# CONTEXT.md — Current Project State

> This file tracks where we are in the project and what's next.
> Update after each work session to maintain continuity.

---

## Current Status

**Phase**: M0 nearly complete, M1 ready to start
**Milestone**: M1 - Core Assistant (Step 1.2 — Users Table is next)
**Last Updated**: 2026-03-14

---

## What We Have

### Code (working)
- ✅ Project initialized: TypeScript, npm, folder structure
- ✅ Tooling: `.gitignore`, `.env.example`, scripts (dev, build, start, typecheck)
- ✅ Env validation: `src/config/env.ts` (zod schema, crashes if invalid)
- ✅ Logger: `src/core/logger.ts` (pino, pretty in dev, redacts secrets)
- ✅ Echo bot: `src/bot/bot.ts` (grammY, echoes messages, error handler)
- ✅ Entry point: `src/index.ts` (starts bot, checks DB, graceful shutdown)
- ✅ DB client: `src/db/client.ts` (Supabase client + health check)
- ✅ Dockerfile created (deployment deferred)

### Infrastructure (user-completed)
- ✅ Telegram bot created via @BotFather (token in .env)
- ✅ Supabase project provisioned (URL + key in .env)
- ✅ `.env` configured with all required values
- ✅ Bot runs locally with `npm run dev`

### Planning docs
- ✅ `.claude/architecture.md` — System architecture
- ✅ `.claude/roadmap.md` — Full roadmap (M0-M7+)
- ✅ `.claude/milestone1.md` — Detailed M1 breakdown
- ✅ `.claude/technical-plan.md` — Step-by-step implementation guide
- ✅ `CLAUDE.md` — AI assistant guide

### Directory structure (created, empty — ready for M1)
- `src/features/users/`, `chat/`, `help/`, `messages/`, `voice/`, `onboarding/`
- `src/bot/middleware/`, `src/bot/handlers/`
- `src/core/skills/`, `src/core/session/`, `src/core/llm/`
- `src/db/migrations/`

---

## What's NOT Done Yet

- ❌ Railway deployment (deferred from M0 — `railway.toml` not created)
- ❌ All M1 features (users table, auth, onboarding, voice, LLM, skills, history, tests)
- ❌ No tests (vitest not installed)
- ❌ No Anthropic or OpenAI API keys (not needed until LLM/voice steps)

---

## Current Milestone: M1 — Core Assistant

**Goal**: Bot onboards users, understands voice/text via LLM, routes intents, keeps history, confirms mutations.

### M1 Progress

| Step | Description | Status |
|------|-------------|--------|
| 1.1 | Supabase Connection | ✅ Done |
| 1.2 | Users Table + Repo | ❌ Next |
| 1.3 | Auth Middleware | ❌ |
| 1.4 | Onboarding Guard | ❌ |
| 1.5 | Onboarding Flow | ❌ |
| 1.6 | Voice Processing | ❌ |
| 1.7 | LLM Router | ❌ |
| 1.8 | Mock LLM Router | ❌ |
| 1.9 | Skill Registry | ❌ |
| 1.10 | Main Message Handler | ❌ |
| 1.11 | Confirmation System | ❌ |
| 1.12 | Messages Table & History | ❌ |
| 1.13 | Rate Limiter | ❌ |
| 1.14 | Tests | ❌ |

---

## Next Steps

1. **Immediate**: Step 1.2 — Users Table
   - Create `src/db/migrations/001_users.sql`
   - User runs migration in Supabase SQL editor
   - Create `src/features/users/user.types.ts` and `user.repo.ts`
   - Write tests for user repo

2. **Then**: Step 1.3 — Auth Middleware
   - Create extended BotContext type
   - Auth middleware (find/create user, attach to ctx)
   - Remove echo handler

3. **Then**: Step 1.4-1.5 — Onboarding Guard + Flow

---

## Decisions Made

- Skipped ESLint/Prettier for now (can add later)
- Deferred Railway deployment to focus on M1 features first
- Using Supabase auth.getSession() for health check (simple, works)

---

## Blockers / Questions

- None currently. Ready to proceed with M1.

---

## Notes for Future Sessions

- Keep mock LLM mode working throughout (for dev without API costs)
- Test onboarding in multiple languages when implementing M1
- Consider adding health check endpoint early (useful for Railway)
- Document any deviations from technical-plan.md

---

## Progress Tracking

| Milestone | Status | Completion |
|-----------|--------|------------|
| M0 - Skeleton & Deploy | 🟡 80% (deploy deferred) | 80% |
| M1 - Core Assistant | 🟡 In Progress | ~7% (1/14 steps) |
| M2 - Tasks & Reminders | ⚪ Planned | 0% |
| M3 - Notes | ⚪ Planned | 0% |
| M4 - Google Calendar | ⚪ Planned | 0% |
| M5+ - Future Features | ⚪ Planned | 0% |

---

## Recent Changes

- 2026-02-25: Initial project setup
  - Planning docs, CLAUDE.md, CONTEXT.md, TASKS_FOR_USER.md, docs/
- 2026-02-25 → 2026-03-14: M0 implementation
  - Project init, tooling, env validation, logger, echo bot, Supabase client
  - User completed: Telegram bot, Supabase project, .env setup
  - Bot runs locally and echoes messages
- 2026-03-14: Status refresh — all docs updated to reflect actual state
