import { prisma } from '@/config/prisma';

export const passwordResetOtpRepository = {
  create(data: { userId: string; otpHash: string; expiresAt: Date }) {
    return prisma.passwordResetOtp.create({ data });
  },
  findLatestValid(userId: string) {
    return prisma.passwordResetOtp.findFirst({
      where: { userId, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  },
  incrementAttempts(id: string) {
    return prisma.passwordResetOtp.update({ where: { id }, data: { attempts: { increment: 1 } } });
  },
  markUsed(id: string) {
    return prisma.passwordResetOtp.update({ where: { id }, data: { used: true } });
  },
  invalidateAllForUser(userId: string) {
    return prisma.passwordResetOtp.updateMany({ where: { userId, used: false }, data: { used: true } });
  },
};
