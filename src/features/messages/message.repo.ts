import { supabase } from '../../db/client.js';
import type { Message } from './message.types.js';

export async function saveMessage(
  userId: string,
  role: 'user' | 'assistant',
  content: string,
  intent?: string,
): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .insert({ user_id: userId, role, content, intent: intent ?? null });

  if (error) {
    throw new Error(`Failed to save message: ${error.message}`);
  }
}

export async function getRecentMessages(
  userId: string,
  limit = 20,
): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select()
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get messages: ${error.message}`);
  }

  // Reverse so oldest is first (chronological order for LLM context)
  return (data as Message[]).reverse();
}
