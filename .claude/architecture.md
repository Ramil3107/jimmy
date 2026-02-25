# ARCHITECTURE — Global System Architecture

> High-level architecture decisions that apply across all milestones.
> This document answers "why" and "how" at the system level.

---

## 1. Folder Structure — Vertical (Feature-Based)

```
assistant-bot/
├── src/
│   ├── index.ts                    # Entry point — start bot
│   ├── config/
│   │   └── env.ts                  # Env validation (zod)
│   │
│   ├── bot/                        # Telegram bot wiring
│   │   ├── bot.ts                  # grammY instance + middleware pipeline
│   │   ├── context.ts              # Extended BotContext type
│   │   ├── keyboards.ts            # Reusable inline keyboard builders
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── onboarding-guard.ts
│   │   │   └── rate-limit.ts
│   │   └── handlers/
│   │       ├── message.handler.ts  # Main text message handler
│   │       └── callback.handler.ts # Inline keyboard callbacks
│   │
│   ├── core/                       # Shared infrastructure (platform-independent)
│   │   ├── logger.ts
│   │   ├── llm/
│   │   │   ├── router.ts           # Intent router (Claude)
│   │   │   ├── mock-router.ts      # Mock for dev
│   │   │   ├── types.ts            # IntentResult, RoutingContext
│   │   │   └── prompts/
│   │   │       └── router.v1.ts    # System prompt
│   │   ├── skills/
│   │   │   ├── registry.ts         # Skill registration
│   │   │   └── types.ts            # Skill interface
│   │   └── session/
│   │       └── pending-actions.ts  # Confirmation system
│   │
│   ├── features/                   # Feature modules (vertical slices)
│   │   ├── users/
│   │   │   ├── user.types.ts
│   │   │   └── user.repo.ts
│   │   ├── messages/
│   │   │   ├── message.types.ts
│   │   │   └── message.repo.ts
│   │   ├── onboarding/
│   │   │   └── onboarding.handler.ts
│   │   ├── voice/
│   │   │   ├── transcriber.ts
│   │   │   └── voice.handler.ts
│   │   ├── chat/
│   │   │   └── chat.skill.ts
│   │   ├── help/
│   │   │   └── help.skill.ts
│   │   ├── tasks/                  # M2
│   │   │   ├── task.types.ts
│   │   │   ├── task.repo.ts
│   │   │   ├── task.skill.ts
│   │   │   └── task.cron.ts
│   │   ├── notes/                  # M3
│   │   │   ├── note.types.ts
│   │   │   ├── note.repo.ts
│   │   │   └── note.skill.ts
│   │   ├── digests/                # M2
│   │   │   ├── digest.service.ts
│   │   │   └── digest.cron.ts
│   │   └── calendar/               # M4
│   │       ├── calendar.types.ts
│   │       ├── calendar.service.ts
│   │       ├── calendar.skill.ts
│   │       └── calendar.oauth.ts
│   │
│   └── db/
│       ├── client.ts               # Supabase client
│       └── migrations/
│           ├── 001_users.sql
│           ├── 002_messages.sql
│           └── 003_tasks.sql
│
├── scripts/
│   ├── test-llm.ts                 # LLM quality test suite
│   └── seed.ts                     # Test data seeder
│
├── .env.example
├── .gitignore
├── Dockerfile
├── railway.toml
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### Why This Structure

**Vertical slices** (`features/`) — each feature owns its types, repo, skill, and cron in one folder. To understand "tasks", you open one folder. No jumping between `controllers/`, `services/`, `models/`.

**Core** stays separate — LLM, skills registry, session management are shared infrastructure, not a feature.

**Bot** stays separate — Telegram-specific wiring (middleware, handlers, keyboards). When adding WhatsApp, you'd add `src/whatsapp/` alongside `src/bot/`, both using the same `core/` and `features/`.

**Flat where possible** — no deeply nested folders. Most folders have 1-4 files max.

---

## 2. Message Processing Pipeline

```
┌──────────────────────────────────────────────────────────────┐
│                    INCOMING MESSAGE                          │
│                  (voice or text)                             │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────┐
│   Middleware: Logger      │  Log incoming message
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│   Middleware: Rate Limit  │  Block if too many messages
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│   Middleware: Auth         │  Find/create user → ctx.user
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│   Middleware: Onboarding  │  If not onboarded → onboarding flow
│   Guard                   │  (skip everything below)
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐     ┌─────────────────────┐
│   Is it a voice message?  │──►  │  Voice: download,   │
│                           │ yes │  convert, transcribe │
└──────────┬───────────────┘     └──────────┬──────────┘
           │ no                              │ text
           ▼                                 ▼
┌──────────────────────────────────────────────────────┐
│              Has pending confirmation?                │
│                                                      │
│  YES → check if user confirmed/cancelled → handle    │
│  NO  → continue to LLM router                       │
└──────────────────────┬───────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────┐
│                  LLM Intent Router                    │
│                                                      │
│  Input: text + context (user, skills, history)       │
│  Output: { intent, confidence, params, response }    │
│                                                      │
│  Low confidence → ask for clarification              │
│  Unknown skill → "I can't do that yet"               │
│  Gibberish → "Can't parse this"                      │
└──────────────────────┬───────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────┐
│               Skill Registry: dispatch                │
│                                                      │
│  Find skill by intent → call skill handler           │
│                                                      │
│  READ action → respond immediately                   │
│  WRITE action → show confirmation → wait for callback│
└──────────────────────┬───────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────┐
│              Save to message history                  │
│              (user message + bot response)            │
└──────────────────────────────────────────────────────┘
```

---

## 3. Skill System

### How Skills Work

Each feature can register one or more **skills**. A skill declares:
- What **intents** it handles (e.g., `create_task`, `list_tasks`)
- A **description** for the LLM (so it knows when to route here)
- **Examples** of user messages that should trigger this skill
- A **handler** function that executes the action

```
Skill Registry
├── chat       → intents: [chat]
├── help       → intents: [help]
├── tasks      → intents: [create_task, list_tasks, complete_task, delete_task, edit_task]
├── notes      → intents: [create_note, list_notes, search_notes, delete_note]
├── calendar   → intents: [list_events, create_event]
└── ...
```

The LLM receives the full skill list with descriptions and examples on every request.
This means:
- Adding a new skill = register it, and the LLM instantly knows about it
- Removing a skill = unregister it, and the LLM stops routing to it
- Bot never claims to do something it can't — it only knows registered skills

### Skill Lifecycle
```
1. Feature creates a Skill object
2. On startup, skill is registered in SkillRegistry
3. SkillRegistry provides descriptions to LLM Router
4. LLM routes messages to matching intents
5. SkillRegistry dispatches to the correct handler
```

---

## 4. Language Handling (No i18n Files)

### Approach
Traditional i18n (translation files per language) doesn't scale for 50+ languages and adds maintenance burden. Instead:

**All dynamic text is generated by the LLM** in the user's language.

- User selects language during onboarding → stored in `users.language`
- Every LLM request includes: `"Always respond in {user.language}"`
- Claude natively speaks 50+ languages — this just works
- Even error messages, confirmations, and suggestions come from LLM

### Fixed UI Elements
Some Telegram elements can't be dynamically generated per-request (inline keyboard buttons). Options:
1. **Keep them minimal and universal** — use emoji (✅, ❌, ⬅️) with very short text
2. **Generate once during onboarding** — ask LLM for button labels in user's language, cache them in user record
3. **Use language-agnostic labels** — "OK", "Cancel" are understood widely

Recommended: option 1 (emoji-heavy buttons) + option 2 for onboarding keyboards.

---

## 5. Platform Independence

### Transport Adapter Pattern

The core logic doesn't know about Telegram. When adding WhatsApp:

```
src/
├── bot/          # Telegram adapter
├── whatsapp/     # WhatsApp adapter (future)
├── api/          # REST API adapter (future)
├── core/         # Platform-independent (LLM, skills, session)
└── features/     # Platform-independent (business logic)
```

Each adapter translates platform-specific input into a **common IncomingMessage format**, and translates outgoing messages into platform-specific format.

```typescript
// Common message format (core doesn't care about platform)
interface IncomingMessage {
  userId: string;        // internal user ID
  platform: 'telegram' | 'whatsapp' | 'api';
  text: string;          // transcribed if voice
  isVoice: boolean;
}

interface OutgoingMessage {
  text: string;
  buttons?: Button[][];  // optional inline buttons
}
```

For now, we build directly with grammY (no premature abstraction). The separation happens naturally because features/ and core/ don't import from bot/.

---

## 6. Data Architecture

### Supabase (PostgreSQL)

All data in one Supabase project. Tables are simple and flat.

**Row Level Security**: every table has user_id, RLS ensures users only see their data.

**Relationships**:
```
users
  ├── messages      (chat history, 1:N)
  ├── tasks         (1:N)
  ├── notes         (1:N)
  ├── google_tokens  (1:N, one per Google account)
  └── (future: subscriptions, habits, finances, etc.)
```

**Migrations**: plain SQL files, run manually or via script. No ORM — Supabase client is enough.

**Encryption**: Google OAuth tokens encrypted at rest (AES-256-GCM). Encryption key in env vars.

---

## 7. LLM Strategy

### Model Usage
- **Intent routing**: Claude Sonnet (fast, cheap, good enough for classification)
- **Free chat**: Claude Sonnet (same model, different system prompt)
- **Digests & summaries**: Claude Sonnet
- **Complex analysis** (future: RAG, reviews): Claude Sonnet or Opus if needed

### Context Window Management
Every LLM request includes:
1. **System prompt**: role, rules, available skills, response format
2. **User context**: name, language, timezone, current datetime
3. **Recent messages**: last 20 messages from history
4. **Skill-specific context** (if applicable): current tasks, relevant notes, etc.

### Cost Control
- Cache system prompts where possible
- Keep message history to 20 messages (not unlimited)
- Use mock LLM in development
- Monitor token usage per user (future: rate limiting by cost)

---

## 8. Security Principles

1. **Env-only secrets**: all API keys via environment variables, never in code
2. **RLS everywhere**: Supabase Row Level Security on all tables
3. **Encrypted tokens**: Google OAuth tokens AES-256-GCM encrypted in DB
4. **Rate limiting**: 30 msg/min per user, prevents abuse
5. **Input validation**: max text length, sanitize before DB insert
6. **No PII in logs**: redact tokens, keys, personal data from log output
7. **Webhook security**: Telegram webhook with secret token (if webhook mode)

---

## 9. Error Handling Strategy

### Levels
1. **LLM errors** (API down, rate limited): reply "I'm having trouble thinking right now, try again in a minute"
2. **Whisper errors**: reply "Couldn't process voice message, try again or send text"
3. **Database errors**: log, reply "Something went wrong, try again"
4. **Validation errors**: reply with specific guidance ("Date format unclear, could you try 'tomorrow at 3pm'?")
5. **Unexpected errors**: log with full context, reply generic error, don't crash

### Principle
- Never crash the bot process
- Never show technical errors to users
- Always give the user a way forward (retry, rephrase, try later)
- Log everything with enough context to debug

---

## 10. Testing Strategy

| Layer | What | How | When |
|---|---|---|---|
| Unit | Repos, helpers, session, registry | Vitest, mock DB | Every PR |
| LLM Quality | Intent routing accuracy | Test suite with expected intents | Before prompt changes |
| Integration | Full message flows | Vitest, mock bot context | Weekly / major changes |
| Manual | End-to-end in Telegram | Checklist | Before deploy |

### Dev Mode Features
- `DEV_MODE=true`: pretty logs, verbose output
- `MOCK_LLM=true`: no API calls, pattern-matched responses
- `scripts/seed.ts`: populate DB with test data
- `scripts/test-llm.ts`: run intent routing quality check

---

## 11. Scaling Considerations (Future)

Not needed now, but architecture should not prevent:

- **Multiple bot instances**: stateless handlers (pending actions could move to Redis)
- **Background jobs**: heavy tasks (embedding, email sync) via BullMQ + Redis
- **Multiple platforms**: transport adapter pattern already in place
- **Large user base**: Supabase scales PostgreSQL, add connection pooling if needed
- **Cost optimization**: per-user token tracking, tiered LLM model selection
