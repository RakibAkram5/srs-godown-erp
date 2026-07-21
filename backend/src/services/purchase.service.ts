import { Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { purchaseRepository } from '@/repositories/purchase.repository';
import { ApiError } from '@/utils/apiError';
import type { PurchaseInput, ReturnInput } from '@/validators/purchase.validator';

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
  purchasePrice: number;
  discount: number;
  lineTotal: number;
}

function computeTotals(input: PurchaseInput) {
  const items: PreparedItem[] = input.items.map((it) => ({
    productId: it.productId,
    productName: it.productName,
    quantity: it.quantity,
    purchasePrice: it.purchasePrice,
    discount: it.discount ?? 0,
    lineTotal: Math.max(0, it.quantity * it.purchasePrice - (it.discount ?? 0)),
  }));

  const subTotal = items.reduce((s, it) => s + it.lineTotal, 0);
  const afterDiscount = Math.max(0, subTotal - (input.discount ?? 0));

  let taxAmount = 0;
  if (input.taxType === 'PERCENT') taxAmount = (afterDiscount * (input.taxValue ?? 0)) / 100;
  else if (input.taxType === 'FIXED') taxAmount = input.taxValue ?? 0;

  const totalAmount = afterDiscount + taxAmount;
  return { items, subTotal, taxAmount, totalAmount };
}

export interface PurchaseListQuery {
  search?: string;
  vendorId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

const SORTABLE = new Set(['purchaseDate', 'totalAmount', 'createdAt']);

export const purchaseService = {
  async list(query: PurchaseListQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(500, Math.max(1, Number(query.limit) || 10));

    const where: Prisma.PurchaseWhereInput = {};
    if (query.search) where.purchaseNo = { contains: query.search, mode: 'insensitive' };
    if (query.vendorId) where.vendorId = query.vendorId;
    if (query.status === 'DRAFT' || query.status === 'COMPLETED') where.status = query.status;
    if (query.dateFrom || query.dateTo) {
      where.purchaseDate = {};
      if (query.dateFrom) where.purchaseDate.gte = new Date(query.dateFrom);
      if (query.dateTo) where.purchaseDate.lte = new Date(`${query.dateTo}T23:59:59`);
    }

    const sortBy = SORTABLE.has(query.sortBy ?? '') ? (query.sortBy as string) : 'createdAt';
    const sortOrder: 'asc' | 'desc' = query.sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy = { [sortBy]: sortOrder } as Prisma.PurchaseOrderByWithRelationInput;

    const [rows, total] = await Promise.all([
      purchaseRepository.findMany(where, orderBy, (page - 1) * limit, limit),
      purchaseRepository.count(where),
    ]);
    const items = rows.map((r) => {
      const { items: lineItems, ...rest } = r as typeof r & { items: { quantity: number }[] };
      const totalQuantity = (lineItems ?? []).reduce((sum, li) => sum + li.quantity, 0);
      return { ...rest, totalQuantity, remaining: rest.totalAmount - rest.paidAmount };
    });

    return { items, total, page, limit, pageCount: Math.max(1, Math.ceil(total / limit)) };
  },

  async get(id: string) {
    const purchase = await purchaseRepository.findById(id);
    if (!purchase) throw ApiError.notFound('Purchase not found');
    return purchase;
  },

  async create(input: PurchaseInput) {
    const { items, subTotal, taxAmount, totalAmount } = computeTotals(input);

    const created = await prisma.purchase.create({
      data: {
        vendorId: input.vendorId,
        purchaseDate: input.purchaseDate ?? new Date(),
        warehouse: clean(input.warehouse),
        rack: clean(input.rack),
        shelf: clean(input.shelf),
        subTotal,
        discount: input.discount ?? 0,
        taxType: input.taxType,
        taxValue: input.taxValue ?? 0,
        taxAmount,
        totalAmount,
        paidAmount: Math.min(input.paidAmount ?? 0, totalAmount),
        notes: clean(input.notes),
        status: 'DRAFT',
        items: { create: items },
      },
    });

    await prisma.purchase.update({
      where: { id: created.id },
      data: { purchaseNo: `PUR-${pad(created.codeNo)}` },
    });

    if (input.status === 'COMPLETED') await this.complete(created.id);
    return this.get(created.id);
  },

  async update(id: string, input: PurchaseInput) {
    const existing = await this.get(id);
    if (existing.status === 'COMPLETED') {
      throw ApiError.badRequest('Completed purchases cannot be edited. Create a return instead.');
    }

    const { items, subTotal, taxAmount, totalAmount } = computeTotals(input);

    await prisma.$transaction(async (tx) => {
      await tx.purchaseItem.deleteMany({ where: { purchaseId: id } });
      await tx.purchase.update({
        where: { id },
        data: {
          vendorId: input.vendorId,
          purchaseDate: input.purchaseDate ?? existing.purchaseDate,
          warehouse: clean(input.warehouse),
          rack: clean(input.rack),
          shelf: clean(input.shelf),
          subTotal,
          discount: input.discount ?? 0,
          taxType: input.taxType,
          taxValue: input.taxValue ?? 0,
          taxAmount,
          totalAmount,
          paidAmount: Math.min(input.paidAmount ?? 0, totalAmount),
          notes: clean(input.notes),
          items: { create: items },
        },
      });
    });

    if (input.status === 'COMPLETED') await this.complete(id);
    return this.get(id);
  },

  // Apply stock inward, update vendor balance, record movements. DRAFT → COMPLETED.
  async complete(id: string) {
    const purchase = await purchaseRepository.findById(id);
    if (!purchase) throw ApiError.notFound('Purchase not found');
    if (purchase.status === 'COMPLETED') throw ApiError.badRequest('Purchase is already completed');
    if (purchase.items.length === 0) throw ApiError.badRequest('Add at least one product before completing');

    await prisma.$transaction(async (tx) => {
      for (const item of purchase.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || product.isDeleted) {
          throw ApiError.badRequest(`Product "${item.productName}" no longer exists`);
        }
        const newStock = product.currentStock + item.quantity;
        await tx.product.update({
          where: { id: product.id },
          data: {
            currentStock: newStock,
            ...(purchase.warehouse ? { warehouse: purchase.warehouse } : {}),
            ...(purchase.rack ? { rack: purchase.rack } : {}),
            ...(purchase.shelf ? { shelf: purchase.shelf } : {}),
          },
        });
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            productName: product.name,
            type: 'PURCHASE_IN',
            quantity: item.quantity,
            balanceAfter: newStock,
            referenceType: 'PURCHASE',
            referenceId: purchase.id,
            referenceNo: purchase.purchaseNo,
          },
        });
      }
      const vendor = await tx.vendor.findUnique({ where: { id: purchase.vendorId } });
      const previousBalance = vendor?.balance ?? 0;
      const unpaid = purchase.totalAmount - purchase.paidAmount; // only the credit portion is owed
      await tx.vendor.update({
        where: { id: purchase.vendorId },
        data: { balance: { increment: unpaid } },
      });
      await tx.purchase.update({ where: { id: purchase.id }, data: { status: 'COMPLETED', previousBalance } });
    });

    return this.get(id);
  },

  async remove(id: string) {
    const purchase = await purchaseRepository.findById(id);
    if (!purchase) throw ApiError.notFound('Purchase not found');

    if (purchase.status !== 'COMPLETED') {
      await prisma.purchase.delete({ where: { id } });
      return;
    }

    // Completed: block if there are returns tied to it.
    const returnCount = await prisma.purchaseReturn.count({ where: { purchaseId: id } });
    if (returnCount > 0) throw ApiError.badRequest('This purchase has returns. Delete the returns first.');

    await prisma.$transaction(async (tx) => {
      // Remove the stock this purchase had added (guard against negative).
      for (const item of purchase.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (product) {
          const newStock = Math.max(0, product.currentStock - item.quantity);
          await tx.product.update({ where: { id: product.id }, data: { currentStock: newStock } });
          await tx.stockMovement.create({
            data: {
              productId: product.id,
              productName: product.name,
              type: 'ADJUSTMENT',
              quantity: -(item.quantity),
              balanceAfter: newStock,
              referenceType: 'PURCHASE_DELETE',
              referenceId: purchase.id,
              referenceNo: purchase.purchaseNo,
              note: 'Purchase deleted — stock removed',
            },
          });
        }
      }
      // Reverse the vendor's outstanding (only the unpaid part had been added).
      const unpaid = purchase.totalAmount - purchase.paidAmount;
      await tx.vendor.update({ where: { id: purchase.vendorId }, data: { balance: { decrement: unpaid } } });
      await tx.purchase.delete({ where: { id: purchase.id } });
    });
  },

  /* ── Purchase Returns ─────────────────────────────── */

  async createReturn(input: ReturnInput) {
    const purchase = await purchaseRepository.findById(input.purchaseId);
    if (!purchase) throw ApiError.notFound('Purchase not found');
    if (purchase.status !== 'COMPLETED') {
      throw ApiError.badRequest('You can only return items from a completed purchase');
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
        if (item.quantity > product.currentStock) {
          throw ApiError.badRequest(`Not enough stock to return "${item.productName}"`);
        }
        const newStock = product.currentStock - item.quantity;
        await tx.product.update({ where: { id: product.id }, data: { currentStock: newStock } });
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            productName: product.name,
            type: 'PURCHASE_RETURN_OUT',
            quantity: -item.quantity,
            balanceAfter: newStock,
            referenceType: 'PURCHASE_RETURN',
            referenceId: purchase.id,
            referenceNo: purchase.purchaseNo,
          },
        });
      }

      const created = await tx.purchaseReturn.create({
        data: {
          purchaseId: purchase.id,
          vendorId: purchase.vendorId,
          returnDate: input.returnDate ?? new Date(),
          totalAmount,
          notes: clean(input.notes),
          items: { create: items },
        },
      });
      const withNo = await tx.purchaseReturn.update({
        where: { id: created.id },
        data: { returnNo: `PRTN-${pad(created.codeNo)}` },
        include: { items: true, vendor: { select: { id: true, name: true } } },
      });

      await tx.vendor.update({
        where: { id: purchase.vendorId },
        data: { balance: { decrement: totalAmount } },
      });

      return withNo;
    });

    return result;
  },

  async listReturns(query: PurchaseListQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(500, Math.max(1, Number(query.limit) || 10));
    const where: Prisma.PurchaseReturnWhereInput = {};
    if (query.search) where.returnNo = { contains: query.search, mode: 'insensitive' };
    if (query.vendorId) where.vendorId = query.vendorId;

    const [items, total] = await Promise.all([
      prisma.purchaseReturn.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          vendor: { select: { id: true, name: true } },
          purchase: { select: { purchaseNo: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.purchaseReturn.count({ where }),
    ]);
    return { items, total, page, limit, pageCount: Math.max(1, Math.ceil(total / limit)) };
  },

  /* ── Stock movements history ──────────────────────── */

  async listStockMovements(query: { productId?: string; type?: string; page?: number; limit?: number }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(500, Math.max(1, Number(query.limit) || 15));
    const where: Prisma.StockMovementWhereInput = {};
    if (query.productId) where.productId = query.productId;
    if (query.type) where.type = query.type as Prisma.StockMovementWhereInput['type'];

    const [items, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.stockMovement.count({ where }),
    ]);
    return { items, total, page, limit, pageCount: Math.max(1, Math.ceil(total / limit)) };
  },
};
