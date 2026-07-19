import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from '@/config/env';
import routes from '@/routes';
import { apiRateLimiter } from '@/middlewares/rateLimiter';
import { errorHandler } from '@/middlewares/error.middleware';
import { notFound } from '@/middlewares/notFound.middleware';

export function createApp(): Application {
  const app = express();

  // ── Security ──────────────────────────────────────────
  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    }),
  );

  // ── Parsing & logging ─────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  if (!env.isProd) app.use(morgan('dev'));

  // ── Rate limiting (all /api routes) ───────────────────
  app.use('/api', apiRateLimiter);

  // ── Routes ────────────────────────────────────────────
  app.get('/', (_req, res) => {
    res.json({ success: true, message: 'SRS Godown ERP API', docs: '/api/health' });
  });
  app.use('/api', routes);

  // ── Fallbacks ─────────────────────────────────────────
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
