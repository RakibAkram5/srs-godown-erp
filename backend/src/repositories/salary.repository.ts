import { Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma';

export const salaryRepository = {
  findMany(where: Prisma.SalaryWhereInput, skip: number, take: number) {
    return prisma.salary.findMany({ where, orderBy: [{ month: 'desc' }, { createdAt: 'desc' }], skip, take });
  },
  count(where: Prisma.SalaryWhereInput) {
    return prisma.salary.count({ where });
  },
  findById(id: string) {
    return prisma.salary.findUnique({ where: { id } });
  },
};
