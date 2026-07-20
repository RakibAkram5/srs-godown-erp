import crypto from 'crypto';

/** Fast one-way hash for opaque tokens (NOT for passwords — use bcrypt for those). */
export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}
