import { AuditAction } from '@prisma/client';
import { prisma } from '@/config/prisma';

export const auditLogRepository = {
  create(data: { userId?: string; action: AuditAction; detail?: string; ipAddress?: string }) {
    return prisma.auditLog.create({ data });
  },
  listForUser(userId: string, take = 20) {
    return prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  },
};
