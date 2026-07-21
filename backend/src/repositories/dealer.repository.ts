import { Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma';

export const dealerRepository = {
  list(where: Prisma.DealerWhereInput) {
    return prisma.dealer.findMany({ where, orderBy: { name: 'asc' } });
  },
  findById(id: string) {
    return prisma.dealer.findUnique({ where: { id } });
  },
  create(data: Prisma.DealerCreateInput) {
    return prisma.dealer.create({ data });
  },
  update(id: string, data: Prisma.DealerUpdateInput) {
    return prisma.dealer.update({ where: { id }, data });
  },
};
