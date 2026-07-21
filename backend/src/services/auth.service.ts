import { AuditAction, User } from '@prisma/client';
import { userRepository } from '@/repositories/user.repository';
import { refreshTokenRepository } from '@/repositories/refreshToken.repository';
import { loginHistoryRepository } from '@/repositories/loginHistory.repository';
import { auditLogRepository } from '@/repositories/auditLog.repository';
import { comparePassword, hashPassword } from '@/utils/password';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshTokenExpiryDate,
  type RefreshTokenPayload,
} from '@/utils/jwt';
import { sha256 } from '@/utils/hash';
import { parseUserAgent } from '@/utils/userAgent';
import { ApiError } from '@/utils/apiError';
import type { LoginInput, UpdateProfileInput } from '@/validators/auth.validator';

export interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
}

function toPublicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    role: user.role,
    permissions: user.permissions,
    profileImage: user.profileImage,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
  };
}

export type PublicUser = ReturnType<typeof toPublicUser>;

async function issueTokens(userId: string, username: string, role: string) {
  const accessToken = signAccessToken({ sub: userId, username, role });
  const refreshToken = signRefreshToken(userId);
  await refreshTokenRepository.create({
    userId,
    tokenHash: sha256(refreshToken),
    expiresAt: refreshTokenExpiryDate(),
  });
  return { accessToken, refreshToken };
}

export const authService = {
  async login(input: LoginInput, ctx: RequestContext) {
    const user = await userRepository.findByUsername(input.username);
    if (!user) {
      throw ApiError.unauthorized('Invalid username or password');
    }
    if (!user.isActive) {
      throw ApiError.forbidden('Your account has been disabled. Contact your administrator.');
    }

    const ok = await comparePassword(input.password, user.password);
    if (!ok) {
      const ua = parseUserAgent(ctx.userAgent);
      await loginHistoryRepository.create({
        userId: user.id,
        ipAddress: ctx.ipAddress,
        browser: ua.browser,
        device: ua.device,
        os: ua.os,
        status: 'FAILED',
      });
      throw ApiError.unauthorized('Invalid username or password');
    }

    const ua = parseUserAgent(ctx.userAgent);
    await userRepository.updateLastLogin(user.id);
    await loginHistoryRepository.create({
      userId: user.id,
      ipAddress: ctx.ipAddress,
      browser: ua.browser,
      device: ua.device,
      os: ua.os,
      status: 'SUCCESS',
    });
    await auditLogRepository.create({
      userId: user.id,
      action: AuditAction.LOGIN,
      detail: `Logged in from ${ua.browser} on ${ua.os}`,
      ipAddress: ctx.ipAddress,
    });

    const tokens = await issueTokens(user.id, user.username, user.role);
    return { ...tokens, user: toPublicUser(user) };
  },

  async refresh(refreshToken: string) {
    let payload: RefreshTokenPayload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized('Session expired. Please sign in again.');
    }

    const record = await refreshTokenRepository.findValid(sha256(refreshToken));
    if (!record) {
      throw ApiError.unauthorized('Session expired. Please sign in again.');
    }

    const user = await userRepository.findById(payload.sub);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('Your session is no longer valid.');
    }

    const accessToken = signAccessToken({
      sub: user.id,
      username: user.username,
      role: user.role,
    });
    return { accessToken };
  },

  async logout(userId: string, refreshToken: string | undefined, ctx: RequestContext) {
    if (refreshToken) {
      await refreshTokenRepository.revoke(sha256(refreshToken));
    }
    await loginHistoryRepository.closeLatestOpen(userId);
    await auditLogRepository.create({
      userId,
      action: AuditAction.LOGOUT,
      detail: 'Logged out',
      ipAddress: ctx.ipAddress,
    });
  },

  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    return toPublicUser(user);
  },

  async updateProfile(userId: string, input: UpdateProfileInput, ctx: RequestContext) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    if (input.email !== user.email) {
      const clash = await userRepository.findByEmail(input.email);
      if (clash && clash.id !== userId) {
        throw ApiError.conflict('That email address is already in use');
      }
    }

    const updated = await userRepository.updateProfile(userId, {
      name: input.name,
      email: input.email,
      phone: input.phone ? input.phone : null,
      profileImage: input.profileImage ? input.profileImage : null,
    });

    await auditLogRepository.create({
      userId,
      action: AuditAction.PROFILE_UPDATE,
      detail: 'Updated profile details',
      ipAddress: ctx.ipAddress,
    });

    return toPublicUser(updated);
  },

  async changePassword(
    userId: string,
    input: { currentPassword: string; newPassword: string },
    ctx: RequestContext,
  ) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    const ok = await comparePassword(input.currentPassword, user.password);
    if (!ok) throw ApiError.badRequest('Your current password is incorrect');

    const hashed = await hashPassword(input.newPassword);
    await userRepository.updatePassword(userId, hashed);
    await refreshTokenRepository.revokeAllForUser(userId);

    await auditLogRepository.create({
      userId,
      action: AuditAction.PASSWORD_CHANGE,
      detail: 'Changed account password',
      ipAddress: ctx.ipAddress,
    });
  },

  listLoginHistory(userId: string) {
    return loginHistoryRepository.listForUser(userId);
  },

  listAuditLog(userId: string) {
    return auditLogRepository.listForUser(userId);
  },
};
