import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { logger } from '../core/logger.js';

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

export async function checkDbConnection(): Promise<void> {
  const { error } = await supabase.rpc('ping').maybeSingle();
  // If the function doesn't exist, try a simple query
  if (error) {
    const { error: queryError } = await supabase.from('_health_check').select('1').limit(0);
    // Table not existing is fine — we just need to verify the connection works
    if (queryError && !queryError.message.includes('does not exist')) {
      throw new Error(`Database connection failed: ${queryError.message}`);
    }
  }
  logger.info('Database connection verified');
}
