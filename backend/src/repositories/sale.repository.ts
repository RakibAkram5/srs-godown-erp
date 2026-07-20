import { Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma';

export const saleRepository = {
  findMany(where: Prisma.SaleWhereInput, orderBy: Prisma.SaleOrderByWithRelationInput, skip: number, take: number) {
    return prisma.sale.findMany({
      where,
      orderBy,
      skip,
      take,
      include: { _count: { select: { items: true } } },
    });
  },
  count(where: Prisma.SaleWhereInput) {
    return prisma.sale.count({ where });
  },
  findById(id: string) {
    return prisma.sale.findUnique({ where: { id }, include: { items: true } });
  },
};
