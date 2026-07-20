import { createApp } from '@/app';
import { env } from '@/config/env';
import { prisma } from '@/config/prisma';
import { logger } from '@/utils/logger';

async function bootstrap() {
  const app = createApp();

  // Verify DB connectivity early, but don't crash if it's momentarily down.
  try {
    await prisma.$connect();
    logger.info('Database connected');
  } catch (err) {
    logger.error('Database connection failed on startup', err);
  }

  const server = app.listen(env.port, () => {
    logger.info(`SRS Godown ERP API running on http://localhost:${env.port}`);
    logger.info(`Health check: http://localhost:${env.port}/api/health`);
  });

  const shutdown = async (signal: string) => {
    logger.warn(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  logger.error('Fatal error during startup', err);
  process.exit(1);
});
