import { supabase } from '../../db/client.js';
import type { User, CreateUserData, UpdateUserData } from './user.types.js';

export async function createUser(data: CreateUserData): Promise<User> {
  const { data: user, error } = await supabase
    .from('users')
    .insert(data)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }

  return user as User;
}

export async function getByTelegramId(telegramId: number): Promise<User | null> {
  const { data: user, error } = await supabase
    .from('users')
    .select()
    .eq('telegram_id', telegramId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    throw new Error(`Failed to get user: ${error.message}`);
  }

  return user as User;
}

export async function updateUser(id: string, data: UpdateUserData): Promise<User> {
  const { data: user, error } = await supabase
    .from('users')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }

  return user as User;
}

export async function updateLastActive(id: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update last_active_at: ${error.message}`);
  }
}
