import { Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { saleRepository } from '@/repositories/sale.repository';
import { ApiError } from '@/utils/apiError';
import { createFulfillmentSale } from '@/services/pendingFulfillment.service';
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
  discountPercent: number;
  lineTotal: number;
}

// Discount is entered as a percentage but stored as both — the fixed
// `discount` amount keeps its historical meaning (used by complete()'s
// pending-quantity proration and everywhere totals are read), while
// `discountPercent` is only for re-populating the edit form and display.
function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function computeTotals(input: SaleInput) {
  const items: PreparedItem[] = input.items.map((it) => {
    const percent = it.discountPercent ?? 0;
    const gross = it.quantity * it.salePrice;
    const discount = round2(gross * (percent / 100));
    return {
      productId: it.productId,
      productName: it.productName,
      quantity: it.quantity,
      salePrice: it.salePrice,
      discount,
      discountPercent: percent,
      lineTotal: Math.max(0, gross - discount),
    };
  });

  const subTotal = items.reduce((s, it) => s + it.lineTotal, 0);
  const overallPercent = input.discountPercent ?? 0;
  const overallDiscount = round2(subTotal * (overallPercent / 100));
  const totalAmount = Math.max(0, subTotal - overallDiscount);

  return { items, subTotal, totalAmount, discount: overallDiscount, discountPercent: overallPercent };
}

export interface SaleListQuery {
  search?: string;
  status?: string;
  city?: string;
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
    if (query.city) where.dealer = { city: { equals: query.city, mode: 'insensitive' } };
    if (query.dateFrom || query.dateTo) {
      where.saleDate = {};
      if (query.dateFrom) where.saleDate.gte = new Date(query.dateFrom);
      if (query.dateTo) where.saleDate.lte = new Date(`${query.dateTo}T23:59:59`);
    }

    const sortBy = SORTABLE.has(query.sortBy ?? '') ? (query.sortBy as string) : 'createdAt';
    const sortOrder: 'asc' | 'desc' = query.sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy = { [sortBy]: sortOrder } as Prisma.SaleOrderByWithRelationInput;

    const [rows, total] = await Promise.all([
      saleRepository.findMany(where, orderBy, (page - 1) * limit, limit),
      saleRepository.count(where),
    ]);
    const items = rows.map((r) => {
      const { items: lineItems, ...rest } = r as typeof r & { items: { quantity: number }[] };
      const totalQuantity = (lineItems ?? []).reduce((sum, li) => sum + li.quantity, 0);
      return { ...rest, totalQuantity, remaining: rest.totalAmount - rest.paidAmount };
    });
    return { items, total, page, limit, pageCount: Math.max(1, Math.ceil(total / limit)) };
  },

  async get(id: string) {
    const sale = await saleRepository.findById(id);
    if (!sale) throw ApiError.notFound('Sale not found');
    return sale;
  },

  async create(input: SaleInput) {
    const { items, subTotal, totalAmount, discount, discountPercent } = computeTotals(input);

    const created = await prisma.sale.create({
      data: {
        dealerId: clean(input.dealerId),
        customerName: clean(input.customerName),
        customerPhone: clean(input.customerPhone),
        saleDate: input.saleDate ?? new Date(),
        subTotal,
        discount,
        discountPercent,
        totalAmount,
        paidAmount: Math.max(0, input.paidAmount ?? 0),
        notes: clean(input.notes),
        status: 'DRAFT',
        items: { create: items },
      },
    });

    await prisma.sale.update({
      where: { id: created.id },
      data: { saleNo: `SAL-${pad(created.codeNo)}` },
    });

    if (input.status === 'COMPLETED') return this.complete(created.id);
    return this.get(created.id);
  },

  async update(id: string, input: SaleInput) {
    const existing = await this.get(id);
    if (existing.status === 'COMPLETED') {
      throw ApiError.badRequest('Completed sales cannot be edited. Create a return instead.');
    }
    const { items, subTotal, totalAmount, discount, discountPercent } = computeTotals(input);

    await prisma.$transaction(async (tx) => {
      await tx.saleItem.deleteMany({ where: { saleId: id } });
      await tx.sale.update({
        where: { id },
        data: {
          dealerId: clean(input.dealerId),
          customerName: clean(input.customerName),
          customerPhone: clean(input.customerPhone),
          saleDate: input.saleDate ?? existing.saleDate,
          subTotal,
          discount,
          discountPercent,
          totalAmount,
          paidAmount: Math.max(0, input.paidAmount ?? 0),
          notes: clean(input.notes),
          items: { create: items },
        },
      });
    });

    if (input.status === 'COMPLETED') return this.complete(id);
    return this.get(id);
  },

  // Apply stock OUTWARD (with stock check). DRAFT → COMPLETED.
  // Only what's actually in stock gets billed on this invoice — any shortfall
  // is recorded as pending (against the dealer) and billed later, once stock
  // arrives, as its own invoice (see pendingFulfillment.service.ts).
  async complete(id: string) {
    const sale = await saleRepository.findById(id);
    if (!sale) throw ApiError.notFound('Sale not found');
    if (sale.status === 'COMPLETED') throw ApiError.badRequest('Sale is already completed');
    if (sale.items.length === 0) throw ApiError.badRequest('Add at least one product before completing');

    const shortages: { productName: string; pendingQuantity: number }[] = [];

    await prisma.$transaction(async (tx) => {
      let subTotal = 0;
      for (const item of sale.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || product.isDeleted) {
          throw ApiError.badRequest(`Product "${item.productName}" no longer exists`);
        }
        // Fulfill as much as stock allows; the rest becomes pending.
        const fulfill = Math.max(0, Math.min(item.quantity, product.currentStock));
        const pending = item.quantity - fulfill;

        // Prorate the line's discount between the delivered and pending portions,
        // so only the delivered part is billed now and the rest is billed correctly
        // once it's fulfilled.
        const discountPerUnit = item.quantity > 0 ? item.discount / item.quantity : 0;
        const billedDiscount = discountPerUnit * fulfill;
        const pendingDiscount = discountPerUnit * pending;
        const billedLineTotal = Math.max(0, fulfill * item.salePrice - billedDiscount);

        if (fulfill > 0) {
          const newStock = product.currentStock - fulfill;
          await tx.product.update({ where: { id: product.id }, data: { currentStock: newStock } });
          await tx.stockMovement.create({
            data: {
              productId: product.id,
              productName: product.name,
              type: 'SALE_OUT',
              quantity: -fulfill,
              balanceAfter: newStock,
              referenceType: 'SALE',
              referenceId: sale.id,
              referenceNo: sale.saleNo,
            },
          });
        }
        if (pending > 0) shortages.push({ productName: item.productName, pendingQuantity: pending });

        await tx.saleItem.update({
          where: { id: item.id },
          data: {
            quantity: fulfill,
            discount: billedDiscount,
            lineTotal: billedLineTotal,
            pendingQuantity: pending,
            pendingDiscount,
          },
        });
        subTotal += billedLineTotal;
      }

      const totalAmount = Math.max(0, subTotal - sale.discount);

      let previousBalance = 0;
      if (sale.dealerId) {
        const dealer = await tx.dealer.findUnique({ where: { id: sale.dealerId } });
        previousBalance = dealer?.balance ?? 0;
        const unpaid = totalAmount - sale.paidAmount; // only the remaining goes to outstanding
        await tx.dealer.update({ where: { id: sale.dealerId }, data: { balance: { increment: unpaid } } });
      }
      await tx.sale.update({
        where: { id: sale.id },
        data: { status: 'COMPLETED', previousBalance, subTotal, totalAmount },
      });
    });

    return { ...(await this.get(id)), shortages };
  },

  async remove(id: string) {
    const sale = await saleRepository.findById(id);
    if (!sale) throw ApiError.notFound('Sale not found');

    if (sale.status !== 'COMPLETED') {
      // Draft: nothing was applied, just delete.
      await prisma.sale.delete({ where: { id } });
      return;
    }

    // Completed: block if there are returns or dispatches tied to it.
    const [returnCount, dispatchCount] = await Promise.all([
      prisma.saleReturn.count({ where: { saleId: id } }),
      prisma.dispatch.count({ where: { saleId: id } }),
    ]);
    if (returnCount > 0) throw ApiError.badRequest('This sale has returns. Delete the returns first.');
    if (dispatchCount > 0) throw ApiError.badRequest('This sale has dispatch records. Delete the dispatch first.');

    await prisma.$transaction(async (tx) => {
      // Put delivered stock back and log a reversing movement.
      // (`quantity` already holds only the delivered amount — `complete()` reduces it
      // to that, separately from `pendingQuantity` which tracks any open backorder.)
      for (const item of sale.items) {
        const delivered = item.quantity;
        if (delivered > 0) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (product) {
            const newStock = product.currentStock + delivered;
            await tx.product.update({ where: { id: product.id }, data: { currentStock: newStock } });
            await tx.stockMovement.create({
              data: {
                productId: product.id,
                productName: product.name,
                type: 'ADJUSTMENT',
                quantity: delivered,
                balanceAfter: newStock,
                referenceType: 'SALE_DELETE',
                referenceId: sale.id,
                referenceNo: sale.saleNo,
                note: 'Sale deleted — stock restored',
              },
            });
          }
        }
      }
      // Reverse the dealer's outstanding (only the unpaid part had been added).
      if (sale.dealerId) {
        const unpaid = sale.totalAmount - sale.paidAmount;
        await tx.dealer.update({ where: { id: sale.dealerId }, data: { balance: { decrement: unpaid } } });
      }
      await tx.sale.delete({ where: { id: sale.id } });
    });
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
      if (sale.dealerId) {
        await tx.dealer.update({
          where: { id: sale.dealerId },
          data: { balance: { decrement: totalAmount } },
        });
      }

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

  /* ── Pending (backorder) items ────────────────────── */

  async listPending() {
    const items = await prisma.saleItem.findMany({
      where: { pendingQuantity: { gt: 0 }, sale: { status: 'COMPLETED' } },
      include: {
        sale: {
          select: { id: true, saleNo: true, saleDate: true, customerName: true, dealer: { select: { name: true } } },
        },
      },
      orderBy: { sale: { saleDate: 'asc' } },
    });

    // Attach current stock for each product.
    const productIds = [...new Set(items.map((i) => i.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, currentStock: true },
    });
    const stockMap = new Map(products.map((p) => [p.id, p.currentStock]));

    return items.map((i) => ({
      id: i.id,
      saleId: i.sale.id,
      saleNo: i.sale.saleNo,
      saleDate: i.sale.saleDate,
      customer: i.sale.dealer?.name ?? i.sale.customerName ?? 'Walk-in',
      productId: i.productId,
      productName: i.productName,
      quantity: i.quantity,
      pendingQuantity: i.pendingQuantity,
      availableStock: stockMap.get(i.productId) ?? 0,
    }));
  },

  // Fulfill (dispatch) part or all of a pending sale item — deducts stock AND
  // bills the recipient for it via a brand-new invoice (the original invoice
  // never included this shortfall in the first place).
  async fulfillItem(itemId: string, requestedQty?: number) {
    const item = await prisma.saleItem.findUnique({
      where: { id: itemId },
      include: { sale: { include: { dealer: true } } },
    });
    if (!item) throw ApiError.notFound('Sale item not found');
    if (item.sale.status !== 'COMPLETED') throw ApiError.badRequest('Only completed sales can be fulfilled');
    if (item.pendingQuantity <= 0) throw ApiError.badRequest('Nothing pending on this item');

    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product || product.isDeleted) throw ApiError.badRequest(`Product "${item.productName}" no longer exists`);
    if (product.currentStock <= 0) throw ApiError.badRequest('No stock available to fulfill');

    const cap = Math.min(item.pendingQuantity, product.currentStock);
    const qty = requestedQty && requestedQty > 0 ? Math.min(requestedQty, cap) : cap;
    if (qty <= 0) throw ApiError.badRequest('Nothing to fulfill');

    const remainingBefore = item.pendingQuantity;
    const recipientName = item.sale.dealer?.name ?? item.sale.customerName ?? 'Walk-in';
    const newSale = await prisma.$transaction((tx) =>
      createFulfillmentSale(
        tx,
        {
          dealerId: item.sale.dealerId,
          customerName: item.sale.customerName,
          customerPhone: item.sale.customerPhone,
          recipientName,
        },
        [{ item, qty }],
        `Fulfilled from pending — ${item.sale.saleNo}`,
      ),
    );

    return { fulfilled: qty, remaining: remainingBefore - qty, newSale };
  },
};
