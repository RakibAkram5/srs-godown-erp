import { prisma } from '@/config/prisma';

export const refreshTokenRepository = {
  create(data: { userId: string; tokenHash: string; expiresAt: Date }) {
    return prisma.refreshToken.create({ data });
  },
  findValid(tokenHash: string) {
    return prisma.refreshToken.findFirst({
      where: { tokenHash, revoked: false, expiresAt: { gt: new Date() } },
    });
  },
  revoke(tokenHash: string) {
    return prisma.refreshToken.updateMany({ where: { tokenHash }, data: { revoked: true } });
  },
  revokeAllForUser(userId: string) {
    return prisma.refreshToken.updateMany({ where: { userId }, data: { revoked: true } });
  },
};
