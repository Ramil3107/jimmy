export interface Message {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  intent: string | null;
  created_at: string;
}
