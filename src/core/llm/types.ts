export interface IntentResult {
  intent: string;
  confidence: number;
  params: Record<string, unknown>;
  response_text: string;
  suggested_actions?: string[];
}

export interface RoutingContext {
  user_name: string;
  language: string;
  timezone: string;
  current_time: string;
  available_skills: SkillDescription[];
  recent_messages: { role: 'user' | 'assistant'; content: string }[];
}

export interface SkillDescription {
  name: string;
  intents: string[];
  description: string;
  examples: string[];
}
