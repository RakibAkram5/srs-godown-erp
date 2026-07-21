import { Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { salaryRepository } from '@/repositories/salary.repository';
import { ApiError } from '@/utils/apiError';
import type { SalaryInput } from '@/validators/salary.validator';

function pad(n: number, len = 5): string {
  return String(n).padStart(len, '0');
}
function clean(v?: string | null) {
  const t = (v ?? '').toString().trim();
  return t.length ? t : null;
}

export interface SalaryListQuery {
  search?: string;
  month?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

function buildWhere(query: SalaryListQuery): Prisma.SalaryWhereInput {
  const where: Prisma.SalaryWhereInput = {};
  if (query.month && query.month !== 'all') where.month = query.month;
  if (query.search) {
    where.OR = [
      { employeeName: { contains: query.search, mode: 'insensitive' } },
      { salaryNo: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  return where;
}

export const salaryService = {
  async list(query: SalaryListQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(1000, Math.max(1, Number(query.limit) || 12));
    const where = buildWhere(query);
    const [items, total, sum] = await Promise.all([
      salaryRepository.findMany(where, (page - 1) * limit, limit),
      salaryRepository.count(where),
      prisma.salary.aggregate({ where, _sum: { amount: true, paidAmount: true } }),
    ]);
    return {
      items,
      total,
      page,
      limit,
      pageCount: Math.max(1, Math.ceil(total / limit)),
      totalAmount: sum._sum.amount ?? 0,
      totalPaid: sum._sum.paidAmount ?? 0,
    };
  },

  async create(input: SalaryInput) {
    const paid = Math.min(input.paidAmount ?? 0, input.amount);
    const created = await prisma.salary.create({
      data: {
        employeeName: input.employeeName.trim(),
        userId: clean(input.userId),
        month: input.month,
        amount: input.amount,
        paidAmount: paid,
        paymentDate: input.paymentDate ?? (paid > 0 ? new Date() : null),
        method: input.method,
        notes: clean(input.notes),
      },
    });
    return prisma.salary.update({ where: { id: created.id }, data: { salaryNo: `SLR-${pad(created.codeNo)}` } });
  },

  async update(id: string, input: SalaryInput) {
    const existing = await salaryRepository.findById(id);
    if (!existing) throw ApiError.notFound('Salary record not found');
    const paid = Math.min(input.paidAmount ?? 0, input.amount);
    return prisma.salary.update({
      where: { id },
      data: {
        employeeName: input.employeeName.trim(),
        userId: clean(input.userId),
        month: input.month,
        amount: input.amount,
        paidAmount: paid,
        paymentDate: input.paymentDate ?? existing.paymentDate,
        method: input.method,
        notes: clean(input.notes),
      },
    });
  },

  async remove(id: string) {
    const existing = await salaryRepository.findById(id);
    if (!existing) throw ApiError.notFound('Salary record not found');
    await prisma.salary.delete({ where: { id } });
  },
};
