import type { IntentResult, RoutingContext } from './types.js';

interface Pattern {
  regex: RegExp;
  intent: string;
  response: string;
  params?: Record<string, unknown>;
}

const patterns: Pattern[] = [
  { regex: /^\/help$/i, intent: 'help', response: 'Here\'s what I can do...' },
  { regex: /^help$/i, intent: 'help', response: 'Here\'s what I can do...' },
  { regex: /^what can you do\??$/i, intent: 'help', response: 'Here\'s what I can do...' },
  // Task intents
  { regex: /\b(show|list|my)\b.*\b(task|tasks|to-?do)\b/i, intent: 'list_tasks', response: '[Mock] Listing tasks.', params: { status: 'open' } },
  { regex: /\b(done|complete|finish|did)\b/i, intent: 'complete_task', response: '[Mock] Completing task.' },
  { regex: /\b(delete|remove)\b.*\b(task|to-?do)\b/i, intent: 'delete_task', response: '[Mock] Deleting task.' },
  { regex: /\b(edit|change|update|move)\b.*\b(task|to-?do)\b/i, intent: 'edit_task', response: '[Mock] Editing task.' },
  { regex: /\b(remind|task|todo|to-do|create)\b/i, intent: 'create_task', response: '[Mock] Creating task.', params: { title: 'Mock task' } },
  // Other
  { regex: /\b(note|remember this|save this)\b/i, intent: 'create_note', response: '[Mock] I\'d save a note for you.' },
  { regex: /\b(calendar|schedule|meetings?|events?)\b/i, intent: 'list_events', response: '[Mock] I\'d check your calendar.' },
];

export function mockRouteMessage(
  text: string,
  context: RoutingContext,
): IntentResult {
  const name = context.user_name || 'friend';

  for (const p of patterns) {
    if (p.regex.test(text)) {
      return {
        intent: p.intent,
        confidence: 0.9,
        params: p.params || {},
        response_text: p.response,
      };
    }
  }

  // Default: chat
  return {
    intent: 'chat',
    confidence: 0.85,
    params: {},
    response_text: `[Mock] Hi ${name}! You said: "${text}". I'm in mock mode — no API calls being made.`,
  };
}
