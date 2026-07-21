import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken, AccessTokenPayload } from '@/utils/jwt';
import { userRepository } from '@/repositories/user.repository';
import { ApiError } from '@/utils/apiError';

export interface AuthUser extends AccessTokenPayload {
  permissions: string[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Verifies the access token AND confirms the account is still active,
 * so a disabled user is logged out on their next request.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Missing or malformed Authorization header'));
  }

  const token = header.slice(7);
  let payload: AccessTokenPayload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    return next(ApiError.unauthorized('Invalid or expired token'));
  }

  try {
    const user = await userRepository.findById(payload.sub);
    if (!user || !user.isActive) {
      return next(ApiError.unauthorized('Your session is no longer valid'));
    }
    req.user = { sub: user.id, username: user.username, role: user.role, permissions: user.permissions ?? [] };
    next();
  } catch (err) {
    next(err);
  }
}

/* Optional role gate — usable in later phases. */
export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (roles.length && !roles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have access to this resource'));
    }
    next();
  };
}

/** Admin-only gate. */
export const adminOnly = authorize('ADMIN');

/**
 * Module-permission gate. Admin always passes; other roles must have the
 * module key in their permissions list.
 */
export function authorizePermission(moduleKey: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (req.user.role === 'ADMIN') return next();
    if ((req.user.permissions ?? []).includes(moduleKey)) return next();
    return next(ApiError.forbidden('You do not have permission for this module'));
  };
}
