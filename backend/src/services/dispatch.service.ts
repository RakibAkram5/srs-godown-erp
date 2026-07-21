import { Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { dispatchRepository } from '@/repositories/dispatch.repository';
import { ApiError } from '@/utils/apiError';
import type { DispatchInput } from '@/validators/dispatch.validator';

function pad(n: number, len = 5): string {
  return String(n).padStart(len, '0');
}
function clean(v?: string | null) {
  const t = (v ?? '').toString().trim();
  return t.length ? t : null;
}

export interface DispatchListQuery {
  search?: string;
  page?: number;
  limit?: number;
}

export const dispatchService = {
  async list(query: DispatchListQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(500, Math.max(1, Number(query.limit) || 10));
    const where: Prisma.DispatchWhereInput = {};
    if (query.search) {
      const s = query.search.trim();
      where.OR = [
        { dispatchNo: { contains: s, mode: 'insensitive' } },
        { biltyNumber: { contains: s, mode: 'insensitive' } },
        { transporterName: { contains: s, mode: 'insensitive' } },
        { city: { contains: s, mode: 'insensitive' } },
      ];
    }
    const [items, total] = await Promise.all([
      dispatchRepository.findMany(where, (page - 1) * limit, limit),
      dispatchRepository.count(where),
    ]);
    return { items, total, page, limit, pageCount: Math.max(1, Math.ceil(total / limit)) };
  },

  async create(input: DispatchInput) {
    const sale = await prisma.sale.findUnique({ where: { id: input.saleId } });
    if (!sale) throw ApiError.notFound('Sale invoice not found');

    const created = await prisma.dispatch.create({
      data: {
        saleId: input.saleId,
        biltyNumber: input.biltyNumber.trim(),
        transporterName: input.transporterName.trim(),
        city: input.city.trim(),
        dispatchDate: input.dispatchDate ?? new Date(),
        notes: clean(input.notes),
      },
    });
    return prisma.dispatch.update({
      where: { id: created.id },
      data: { dispatchNo: `DSP-${pad(created.codeNo)}` },
      include: { sale: { select: { saleNo: true, customerName: true, dealer: { select: { name: true } } } } },
    });
  },

  async remove(id: string) {
    const dispatch = await dispatchRepository.findById(id);
    if (!dispatch) throw ApiError.notFound('Dispatch not found');
    await prisma.dispatch.delete({ where: { id } });
  },
};
