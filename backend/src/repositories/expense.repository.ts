import { Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma';

export const expenseRepository = {
  findMany(where: Prisma.ExpenseWhereInput, skip: number, take: number) {
    return prisma.expense.findMany({ where, orderBy: { expenseDate: 'desc' }, skip, take });
  },
  count(where: Prisma.ExpenseWhereInput) {
    return prisma.expense.count({ where });
  },
  findById(id: string) {
    return prisma.expense.findUnique({ where: { id } });
  },
};
