import pino from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  ...(env.DEV_MODE && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  }),
  redact: ['BOT_TOKEN', 'SUPABASE_KEY', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY'],
});
