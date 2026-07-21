import { Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma';

export const purchaseRepository = {
  findMany(where: Prisma.PurchaseWhereInput, orderBy: Prisma.PurchaseOrderByWithRelationInput, skip: number, take: number) {
    return prisma.purchase.findMany({
      where,
      orderBy,
      skip,
      take,
      include: { vendor: { select: { id: true, name: true } }, items: { select: { quantity: true } }, _count: { select: { items: true } } },
    });
  },
  count(where: Prisma.PurchaseWhereInput) {
    return prisma.purchase.count({ where });
  },
  findById(id: string) {
    return prisma.purchase.findUnique({
      where: { id },
      include: { vendor: true, items: true },
    });
  },
};
