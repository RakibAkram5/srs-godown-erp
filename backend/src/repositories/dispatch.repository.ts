import { Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma';

const saleInclude = {
  sale: { select: { saleNo: true, customerName: true, dealer: { select: { name: true } } } },
};

export const dispatchRepository = {
  findMany(where: Prisma.DispatchWhereInput, skip: number, take: number) {
    return prisma.dispatch.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take, include: saleInclude });
  },
  count(where: Prisma.DispatchWhereInput) {
    return prisma.dispatch.count({ where });
  },
  findById(id: string) {
    return prisma.dispatch.findUnique({ where: { id } });
  },
};
