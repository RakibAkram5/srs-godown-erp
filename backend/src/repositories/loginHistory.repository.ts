import { prisma } from '@/config/prisma';

export const loginHistoryRepository = {
  create(data: {
    userId: string;
    ipAddress?: string;
    browser?: string;
    device?: string;
    os?: string;
    status?: string;
  }) {
    return prisma.loginHistory.create({ data });
  },
  // Close the most recent still-open session for a user (sets logoutAt).
  async closeLatestOpen(userId: string) {
    const open = await prisma.loginHistory.findFirst({
      where: { userId, logoutAt: null, status: 'SUCCESS' },
      orderBy: { loginAt: 'desc' },
    });
    if (open) {
      await prisma.loginHistory.update({
        where: { id: open.id },
        data: { logoutAt: new Date() },
      });
    }
  },
  listForUser(userId: string, take = 20) {
    return prisma.loginHistory.findMany({
      where: { userId },
      orderBy: { loginAt: 'desc' },
      take,
    });
  },
};
