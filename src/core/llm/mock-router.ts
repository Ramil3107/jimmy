import type { IntentResult, RoutingContext } from './types.js';

const patterns: { regex: RegExp; intent: string; response: string }[] = [
  { regex: /^\/help|help|what can you do/i, intent: 'help', response: 'Here\'s what I can do...' },
  { regex: /^\/start/i, intent: 'help', response: 'Welcome!' },
  { regex: /remind|task|todo|to-do/i, intent: 'create_task', response: '[Mock] I\'d create a task for you.' },
  { regex: /note|remember|save/i, intent: 'create_note', response: '[Mock] I\'d save a note for you.' },
  { regex: /calendar|schedule|meeting|event/i, intent: 'list_events', response: '[Mock] I\'d check your calendar.' },
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
        params: {},
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
