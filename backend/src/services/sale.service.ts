import { Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { saleRepository } from '@/repositories/sale.repository';
import { ApiError } from '@/utils/apiError';
import type { SaleInput, SaleReturnInput } from '@/validators/sale.validator';

function pad(n: number, len = 5): string {
  return String(n).padStart(len, '0');
}
function clean(v?: string | null) {
  const t = (v ?? '').toString().trim();
  return t.length ? t : null;
}

interface PreparedItem {
  productId: string;
  productName: string;
  quantity: number;
  salePrice: number;
  discount: number;
  lineTotal: number;
}

function computeTotals(input: SaleInput) {
  const items: PreparedItem[] = input.items.map((it) => ({
    productId: it.productId,
    productName: it.productName,
    quantity: it.quantity,
    salePrice: it.salePrice,
    discount: it.discount ?? 0,
    lineTotal: Math.max(0, it.quantity * it.salePrice - (it.discount ?? 0)),
  }));

  const subTotal = items.reduce((s, it) => s + it.lineTotal, 0);
  const afterDiscount = Math.max(0, subTotal - (input.discount ?? 0));

  let taxAmount = 0;
  if (input.taxType === 'PERCENT') taxAmount = (afterDiscount * (input.taxValue ?? 0)) / 100;
  else if (input.taxType === 'FIXED') taxAmount = input.taxValue ?? 0;

  const totalAmount = afterDiscount + taxAmount;
  return { items, subTotal, taxAmount, totalAmount };
}

export interface SaleListQuery {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

const SORTABLE = new Set(['saleDate', 'totalAmount', 'createdAt']);

export const saleService = {
  async list(query: SaleListQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(500, Math.max(1, Number(query.limit) || 10));

    const where: Prisma.SaleWhereInput = {};
    if (query.search) {
      const s = query.search.trim();
      where.OR = [
        { saleNo: { contains: s, mode: 'insensitive' } },
        { customerName: { contains: s, mode: 'insensitive' } },
      ];
    }
    if (query.status === 'DRAFT' || query.status === 'COMPLETED') where.status = query.status;
    if (query.dateFrom || query.dateTo) {
      where.saleDate = {};
      if (query.dateFrom) where.saleDate.gte = new Date(query.dateFrom);
      if (query.dateTo) where.saleDate.lte = new Date(`${query.dateTo}T23:59:59`);
    }

    const sortBy = SORTABLE.has(query.sortBy ?? '') ? (query.sortBy as string) : 'createdAt';
    const sortOrder: 'asc' | 'desc' = query.sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy = { [sortBy]: sortOrder } as Prisma.SaleOrderByWithRelationInput;

    const [items, total] = await Promise.all([
      saleRepository.findMany(where, orderBy, (page - 1) * limit, limit),
      saleRepository.count(where),
    ]);
    return { items, total, page, limit, pageCount: Math.max(1, Math.ceil(total / limit)) };
  },

  async get(id: string) {
    const sale = await saleRepository.findById(id);
    if (!sale) throw ApiError.notFound('Sale not found');
    return sale;
  },

  async create(input: SaleInput) {
    const { items, subTotal, taxAmount, totalAmount } = computeTotals(input);

    const created = await prisma.sale.create({
      data: {
        customerName: clean(input.customerName),
        customerPhone: clean(input.customerPhone),
        saleDate: input.saleDate ?? new Date(),
        subTotal,
        discount: input.discount ?? 0,
        taxType: input.taxType,
        taxValue: input.taxValue ?? 0,
        taxAmount,
        totalAmount,
        notes: clean(input.notes),
        status: 'DRAFT',
        items: { create: items },
      },
    });

    await prisma.sale.update({
      where: { id: created.id },
      data: { saleNo: `SAL-${pad(created.codeNo)}` },
    });

    if (input.status === 'COMPLETED') await this.complete(created.id);
    return this.get(created.id);
  },

  async update(id: string, input: SaleInput) {
    const existing = await this.get(id);
    if (existing.status === 'COMPLETED') {
      throw ApiError.badRequest('Completed sales cannot be edited. Create a return instead.');
    }
    const { items, subTotal, taxAmount, totalAmount } = computeTotals(input);

    await prisma.$transaction(async (tx) => {
      await tx.saleItem.deleteMany({ where: { saleId: id } });
      await tx.sale.update({
        where: { id },
        data: {
          customerName: clean(input.customerName),
          customerPhone: clean(input.customerPhone),
          saleDate: input.saleDate ?? existing.saleDate,
          subTotal,
          discount: input.discount ?? 0,
          taxType: input.taxType,
          taxValue: input.taxValue ?? 0,
          taxAmount,
          totalAmount,
          notes: clean(input.notes),
          items: { create: items },
        },
      });
    });

    if (input.status === 'COMPLETED') await this.complete(id);
    return this.get(id);
  },

  // Apply stock OUTWARD (with stock check). DRAFT → COMPLETED.
  async complete(id: string) {
    const sale = await saleRepository.findById(id);
    if (!sale) throw ApiError.notFound('Sale not found');
    if (sale.status === 'COMPLETED') throw ApiError.badRequest('Sale is already completed');
    if (sale.items.length === 0) throw ApiError.badRequest('Add at least one product before completing');

    await prisma.$transaction(async (tx) => {
      for (const item of sale.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || product.isDeleted) {
          throw ApiError.badRequest(`Product "${item.productName}" no longer exists`);
        }
        if (item.quantity > product.currentStock) {
          throw ApiError.badRequest(
            `Not enough stock for "${item.productName}". Available: ${product.currentStock}, needed: ${item.quantity}`,
          );
        }
        const newStock = product.currentStock - item.quantity;
        await tx.product.update({ where: { id: product.id }, data: { currentStock: newStock } });
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            productName: product.name,
            type: 'SALE_OUT',
            quantity: -item.quantity,
            balanceAfter: newStock,
            referenceType: 'SALE',
            referenceId: sale.id,
            referenceNo: sale.saleNo,
          },
        });
      }
      await tx.sale.update({ where: { id: sale.id }, data: { status: 'COMPLETED' } });
    });

    return this.get(id);
  },

  async remove(id: string) {
    const sale = await this.get(id);
    if (sale.status === 'COMPLETED') {
      throw ApiError.badRequest('Completed sales cannot be deleted. Create a return instead.');
    }
    await prisma.sale.delete({ where: { id } });
  },

  /* ── Sale Returns (items come back into stock) ─────── */

  async createReturn(input: SaleReturnInput) {
    const sale = await saleRepository.findById(input.saleId);
    if (!sale) throw ApiError.notFound('Sale not found');
    if (sale.status !== 'COMPLETED') {
      throw ApiError.badRequest('You can only return items from a completed sale');
    }

    const items = input.items.map((it) => ({
      productId: it.productId,
      productName: it.productName,
      quantity: it.quantity,
      price: it.price,
      lineTotal: it.quantity * it.price,
    }));
    const totalAmount = items.reduce((s, it) => s + it.lineTotal, 0);

    const result = await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || product.isDeleted) {
          throw ApiError.badRequest(`Product "${item.productName}" no longer exists`);
        }
        const newStock = product.currentStock + item.quantity;
        await tx.product.update({ where: { id: product.id }, data: { currentStock: newStock } });
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            productName: product.name,
            type: 'SALE_RETURN_IN',
            quantity: item.quantity,
            balanceAfter: newStock,
            referenceType: 'SALE_RETURN',
            referenceId: sale.id,
            referenceNo: sale.saleNo,
          },
        });
      }

      const created = await tx.saleReturn.create({
        data: {
          saleId: sale.id,
          returnDate: input.returnDate ?? new Date(),
          totalAmount,
          notes: clean(input.notes),
          items: { create: items },
        },
      });
      return tx.saleReturn.update({
        where: { id: created.id },
        data: { returnNo: `SRTN-${pad(created.codeNo)}` },
        include: { items: true },
      });
    });

    return result;
  },

  async listReturns(query: SaleListQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(500, Math.max(1, Number(query.limit) || 10));
    const where: Prisma.SaleReturnWhereInput = {};
    if (query.search) where.returnNo = { contains: query.search, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      prisma.saleReturn.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          sale: { select: { saleNo: true, customerName: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.saleReturn.count({ where }),
    ]);
    return { items, total, page, limit, pageCount: Math.max(1, Math.ceil(total / limit)) };
  },
};
