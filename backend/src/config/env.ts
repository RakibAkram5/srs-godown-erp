import dotenv from 'dotenv';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

// In production every one of these MUST come from the real environment —
// a missing var should crash the boot rather than silently run with an
// insecure default. Outside production, a dev fallback keeps local setup friction-free.
function required(key: string, devFallback?: string): string {
  const value = process.env[key] ?? (isProd ? undefined : devFallback);
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProd,
  port: Number(process.env.PORT ?? 5000),
  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  databaseUrl: required(
    'DATABASE_URL',
    'postgresql://postgres:postgres@localhost:5432/srs_godown?schema=public',
  ),

  // Access token — short lived. Refreshed automatically by the frontend.
  jwtSecret: required('JWT_SECRET', 'dev-insecure-secret-change-me'),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? process.env.JWT_EXPIRES_IN ?? '15m',

  // Refresh token — long lived. Stored (hashed) in the DB so it can be revoked.
  jwtRefreshSecret: required('JWT_REFRESH_SECRET', 'dev-insecure-refresh-secret-change-me'),
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',

  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
    max: Number(process.env.RATE_LIMIT_MAX ?? 300),
  },
} as const;
