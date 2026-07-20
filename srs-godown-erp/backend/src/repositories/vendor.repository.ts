import { Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma';

export const vendorRepository = {
  list(where: Prisma.VendorWhereInput) {
    return prisma.vendor.findMany({ where, orderBy: { name: 'asc' } });
  },
  findById(id: string) {
    return prisma.vendor.findUnique({ where: { id } });
  },
  create(data: Prisma.VendorCreateInput) {
    return prisma.vendor.create({ data });
  },
  update(id: string, data: Prisma.VendorUpdateInput) {
    return prisma.vendor.update({ where: { id }, data });
  },
};
