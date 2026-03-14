import type { IntentResult, RoutingContext } from './types.js';

interface Pattern {
  regex: RegExp;
  intent: string;
  response: string;
  extractParams?: (text: string) => Record<string, unknown>;
}

const patterns: Pattern[] = [
  { regex: /^\/help$/i, intent: 'help', response: 'Here\'s what I can do...' },
  { regex: /^help$/i, intent: 'help', response: 'Here\'s what I can do...' },
  { regex: /^what can you do\??$/i, intent: 'help', response: 'Here\'s what I can do...' },
  // Task intents — order matters (more specific before general)
  {
    regex: /\b(show|list|my)\b.*\b(task|tasks|to-?do)\b/i,
    intent: 'list_tasks',
    response: '[Mock] Listing tasks.',
    extractParams: (text) => {
      if (/\b(week|weekly)\b/i.test(text)) return { view: 'week' };
      if (/\b(all)\b/i.test(text)) return { view: 'all' };
      if (/\b(done|completed|finished)\b/i.test(text)) return { view: 'done' };
      return { view: 'today' };
    },
  },
  {
    regex: /\b(done|complete|finish|did|finished|completed)\b/i,
    intent: 'complete_task',
    response: '[Mock] Completing task.',
    extractParams: (text) => {
      // Try to extract what comes after "mark ... as done" or "I did ..."
      const match = text.match(/(?:mark\s+)?(.+?)(?:\s+as\s+done|\s+is\s+done|\s+done)/i)
        || text.match(/(?:I\s+did|finished|completed)\s+(.+)/i);
      return { title_query: match?.[1]?.trim() || text };
    },
  },
  {
    regex: /\b(delete|remove)\b.*\b(task|to-?do)\b/i,
    intent: 'delete_task',
    response: '[Mock] Deleting task.',
    extractParams: (text) => {
      const match = text.match(/(?:delete|remove)\s+(?:the\s+)?(.+?)(?:\s+task|\s+to-?do)/i);
      return { title_query: match?.[1]?.trim() || text };
    },
  },
  {
    regex: /\b(edit|change|update|move)\b.*\b(task|to-?do)\b/i,
    intent: 'edit_task',
    response: '[Mock] Editing task.',
    extractParams: (text) => {
      const match = text.match(/(?:edit|change|update|move)\s+(?:the\s+)?(.+?)(?:\s+task|\s+to-?do)/i);
      return { title_query: match?.[1]?.trim() || text, updates: {} };
    },
  },
  {
    regex: /\b(remind|task|todo|to-do|create)\b/i,
    intent: 'create_task',
    response: '[Mock] Creating task.',
    extractParams: (text) => {
      const match = text.match(/(?:remind\s+me\s+to|create\s+task|add\s+task)\s+(.+)/i);
      return { title: match?.[1]?.trim() || 'Mock task' };
    },
  },
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
        params: p.extractParams ? p.extractParams(text) : {},
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
