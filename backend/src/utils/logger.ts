/* Tiny dependency-free logger with levels + timestamps. */
type Level = 'info' | 'warn' | 'error' | 'debug';

const colors: Record<Level, string> = {
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  debug: '\x1b[90m',
};
const reset = '\x1b[0m';

function log(level: Level, message: string, meta?: unknown) {
  const ts = new Date().toISOString();
  const prefix = `${colors[level]}[${level.toUpperCase()}]${reset}`;
  if (meta !== undefined) {
    console[level === 'debug' ? 'log' : level](`${prefix} ${ts} — ${message}`, meta);
  } else {
    console[level === 'debug' ? 'log' : level](`${prefix} ${ts} — ${message}`);
  }
}

export const logger = {
  info: (m: string, meta?: unknown) => log('info', m, meta),
  warn: (m: string, meta?: unknown) => log('warn', m, meta),
  error: (m: string, meta?: unknown) => log('error', m, meta),
  debug: (m: string, meta?: unknown) => {
    if (process.env.NODE_ENV !== 'production') log('debug', m, meta);
  },
};
