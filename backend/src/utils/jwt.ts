import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '@/config/env';

/** Payload embedded in the short-lived access token. */
export interface AccessTokenPayload {
  sub: string;
  username: string;
  role: string;
}

/** Payload embedded in the long-lived refresh token. */
export interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtAccessExpiresIn,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwtSecret) as AccessTokenPayload;
}

export function signRefreshToken(userId: string): string {
  const payload: RefreshTokenPayload = { sub: userId, type: 'refresh' };
  return jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn,
  } as SignOptions);
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.jwtRefreshSecret) as RefreshTokenPayload;
}

/** Milliseconds until refresh token expiry — used to set the DB record's expiresAt. */
export function refreshTokenExpiryDate(): Date {
  const decoded = jwt.decode(signRefreshToken('probe')) as { exp?: number } | null;
  // Fallback to 30 days if decode fails for any reason.
  const ms = decoded?.exp ? decoded.exp * 1000 - Date.now() : 30 * 24 * 60 * 60 * 1000;
  return new Date(Date.now() + ms);
}
