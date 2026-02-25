import { bot } from './bot/bot.js';
import { logger } from './core/logger.js';
import { checkDbConnection } from './db/client.js';

async function main() {
  logger.info('Starting Jimmy bot...');
  await checkDbConnection();
  await bot.start({
    onStart: () => logger.info('Jimmy bot is running'),
  });
}

main().catch((err) => {
  logger.fatal(err, 'Failed to start bot');
  process.exit(1);
});

// Graceful shutdown
const shutdown = () => {
  logger.info('Shutting down...');
  bot.stop();
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
