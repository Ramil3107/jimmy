# CONTEXT.md — Current Project State

> This file tracks where we are in the project and what's next.

---

## Current Status

**Phase**: M2 complete (except daily digests, deferred)
**Milestone**: M2 - Tasks & Reminders (Steps 2.1-2.10 done)
**Last Updated**: 2026-03-14

---

## What's Working

### M1 — Core Assistant (COMPLETE)
- Auth middleware (auto-create users, attach to ctx)
- Onboarding (language, name, timezone via LLM, digest times, tour)
- Voice transcription (Whisper, 2min limit)
- LLM Router (OpenAI GPT-4o-mini, mock mode)
- Skill Registry (chat, help, tasks)
- Message handler (all skills own their replies)
- Chat history (saved to DB, last 20 as LLM context)
- Confirmation system (pending actions, 5min TTL)
- Rate limiter (30 msg/min)
- 105 tests across 15 files

### M2 — Tasks (IN PROGRESS)
- Tasks table created in Supabase
- Task repo: full CRUD + getDueReminders + clearReminder
- Task skill: create, list, complete, edit, delete — all with confirmation
- List views: today (default), all open, week by weekday, completed
- Smart search: exact → substring → word-by-word matching
- Delete/edit works on done tasks too
- Pretty formatting with ○/✓, MarkdownV2, friendly random phrases
- LLM prompt has explicit task intent routing rules

### What's NOT Done Yet (M2)
- Step 2.11: Daily digests (deferred to later)

---

## Key Architecture Decisions

- **OpenAI everywhere** (not Anthropic) — user preference, cost
- **LLM does date parsing** — no date library, LLM resolves "tomorrow 3pm" to ISO
- **LLM does timezone resolution** — user types "Lisbon", LLM returns Europe/Lisbon
- **All skills own their replies** — message handler never sends response_text when skill found
- **mutatesData flag** — on Skill interface, distinguishes read vs write skills
- **confirmed flag pattern** — callback handler passes { ...params, confirmed: true }

---

## Tech Stack

- Node.js + TypeScript, grammY, Supabase, OpenAI GPT-4o-mini
- Vitest for tests, pino for logging, zod for env validation
- 105 tests, all passing

---

## Next Steps

1. Deploy to Railway (M0 Step 0.6)
2. Or start M3 — Notes

---

## Progress Tracking

| Milestone | Status | Completion |
|-----------|--------|------------|
| M0 - Skeleton & Deploy | 🟡 80% (deploy deferred) | 80% |
| M1 - Core Assistant | ✅ Complete | 100% |
| M2 - Tasks & Reminders | ✅ Complete (digests deferred) | ~95% |
| M3 - Notes | ⚪ Planned | 0% |
| M4 - Google Calendar | ⚪ Planned | 0% |
