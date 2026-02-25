import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { logger } from '../core/logger.js';

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

export async function checkDbConnection(): Promise<void> {
  // Auth endpoint is always available — no tables needed
  const { error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(`Database connection failed: ${error.message}`);
  }
  logger.info('Database connection verified');
}
