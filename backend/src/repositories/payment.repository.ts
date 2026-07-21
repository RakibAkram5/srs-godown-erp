import { Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma';

export const paymentRepository = {
  findMany(where: Prisma.PaymentWhereInput, skip: number, take: number) {
    return prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        vendor: { select: { id: true, name: true } },
        dealer: { select: { id: true, name: true } },
      },
    });
  },
  count(where: Prisma.PaymentWhereInput) {
    return prisma.payment.count({ where });
  },
  findById(id: string) {
    return prisma.payment.findUnique({ where: { id } });
  },
};
