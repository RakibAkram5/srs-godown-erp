import { Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { expenseRepository } from '@/repositories/expense.repository';
import { ApiError } from '@/utils/apiError';
import type { ExpenseInput } from '@/validators/expense.validator';

function pad(n: number, len = 5): string {
  return String(n).padStart(len, '0');
}
function clean(v?: string | null) {
  const t = (v ?? '').toString().trim();
  return t.length ? t : null;
}

export interface ExpenseListQuery {
  search?: string;
  category?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

function buildWhere(query: ExpenseListQuery): Prisma.ExpenseWhereInput {
  const where: Prisma.ExpenseWhereInput = {};
  if (query.category && query.category !== 'all') where.category = query.category;
  if (query.search) {
    where.OR = [
      { category: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
      { expenseNo: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.from || query.to) {
    where.expenseDate = {};
    if (query.from) where.expenseDate.gte = new Date(query.from);
    if (query.to) where.expenseDate.lte = new Date(`${query.to}T23:59:59`);
  }
  return where;
}

export const expenseService = {
  async list(query: ExpenseListQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(1000, Math.max(1, Number(query.limit) || 12));
    const where = buildWhere(query);
    const [items, total, sum] = await Promise.all([
      expenseRepository.findMany(where, (page - 1) * limit, limit),
      expenseRepository.count(where),
      prisma.expense.aggregate({ where, _sum: { amount: true } }),
    ]);
    return { items, total, page, limit, pageCount: Math.max(1, Math.ceil(total / limit)), totalAmount: sum._sum.amount ?? 0 };
  },

  async create(input: ExpenseInput) {
    const created = await prisma.expense.create({
      data: {
        category: input.category.trim(),
        amount: input.amount,
        expenseDate: input.expenseDate ?? new Date(),
        method: input.method,
        description: clean(input.description),
        notes: clean(input.notes),
      },
    });
    return prisma.expense.update({ where: { id: created.id }, data: { expenseNo: `EXP-${pad(created.codeNo)}` } });
  },

  async update(id: string, input: ExpenseInput) {
    const existing = await expenseRepository.findById(id);
    if (!existing) throw ApiError.notFound('Expense not found');
    return prisma.expense.update({
      where: { id },
      data: {
        category: input.category.trim(),
        amount: input.amount,
        expenseDate: input.expenseDate ?? existing.expenseDate,
        method: input.method,
        description: clean(input.description),
        notes: clean(input.notes),
      },
    });
  },

  async remove(id: string) {
    const existing = await expenseRepository.findById(id);
    if (!existing) throw ApiError.notFound('Expense not found');
    await prisma.expense.delete({ where: { id } });
  },
};
