import { Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma';

export const productRepository = {
  findMany(where: Prisma.ProductWhereInput, orderBy: Prisma.ProductOrderByWithRelationInput, skip: number, take: number) {
    return prisma.product.findMany({ where, orderBy, skip, take });
  },
  count(where: Prisma.ProductWhereInput) {
    return prisma.product.count({ where });
  },
  findById(id: string) {
    return prisma.product.findUnique({ where: { id } });
  },
  create(data: Prisma.ProductCreateInput) {
    return prisma.product.create({ data });
  },
  update(id: string, data: Prisma.ProductUpdateInput) {
    return prisma.product.update({ where: { id }, data });
  },
};
