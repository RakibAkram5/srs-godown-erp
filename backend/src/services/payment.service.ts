import { Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { paymentRepository } from '@/repositories/payment.repository';
import { ApiError } from '@/utils/apiError';
import type { PaymentInput } from '@/validators/payment.validator';

function pad(n: number, len = 5): string {
  return String(n).padStart(len, '0');
}
function clean(v?: string | null) {
  const t = (v ?? '').toString().trim();
  return t.length ? t : null;
}

export interface PaymentListQuery {
  type?: string;
  vendorId?: string;
  dealerId?: string;
  page?: number;
  limit?: number;
}

export const paymentService = {
  async list(query: PaymentListQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(500, Math.max(1, Number(query.limit) || 15));
    const where: Prisma.PaymentWhereInput = {};
    if (query.type === 'VENDOR_PAYMENT' || query.type === 'DEALER_RECEIPT') where.type = query.type;
    if (query.vendorId) where.vendorId = query.vendorId;
    if (query.dealerId) where.dealerId = query.dealerId;

    const [items, total] = await Promise.all([
      paymentRepository.findMany(where, (page - 1) * limit, limit),
      paymentRepository.count(where),
    ]);
    return { items, total, page, limit, pageCount: Math.max(1, Math.ceil(total / limit)) };
  },

  async create(input: PaymentInput) {
    const amount = input.amount;

    if (input.type === 'VENDOR_PAYMENT') {
      const vendorId = clean(input.vendorId);
      if (!vendorId) throw ApiError.badRequest('Vendor is required for a payment');
      const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
      if (!vendor || vendor.isDeleted) throw ApiError.notFound('Vendor not found');

      return prisma.$transaction(async (tx) => {
        const created = await tx.payment.create({
          data: {
            type: 'VENDOR_PAYMENT',
            amount,
            method: input.method,
            paymentDate: input.paymentDate ?? new Date(),
            notes: clean(input.notes),
            vendorId,
          },
        });
        const withNo = await tx.payment.update({
          where: { id: created.id },
          data: { voucherNo: `PAY-${pad(created.codeNo)}` },
          include: { vendor: { select: { id: true, name: true } } },
        });
        await tx.vendor.update({ where: { id: vendorId }, data: { balance: { decrement: amount } } });
        return withNo;
      });
    }

    // DEALER_RECEIPT
    const dealerId = clean(input.dealerId);
    if (!dealerId) throw ApiError.badRequest('Dealer is required for a receipt');
    const dealer = await prisma.dealer.findUnique({ where: { id: dealerId } });
    if (!dealer || dealer.isDeleted) throw ApiError.notFound('Dealer not found');

    return prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          type: 'DEALER_RECEIPT',
          amount,
          method: input.method,
          paymentDate: input.paymentDate ?? new Date(),
          notes: clean(input.notes),
          dealerId,
        },
      });
      const withNo = await tx.payment.update({
        where: { id: created.id },
        data: { voucherNo: `RCV-${pad(created.codeNo)}` },
        include: { dealer: { select: { id: true, name: true } } },
      });
      await tx.dealer.update({ where: { id: dealerId }, data: { balance: { decrement: amount } } });
      return withNo;
    });
  },

  async update(id: string, input: { amount: number; method: 'CASH' | 'BANK' | 'CARD' | 'CHEQUE' | 'OTHER'; paymentDate?: Date; notes?: string | null }) {
    const payment = await paymentRepository.findById(id);
    if (!payment) throw ApiError.notFound('Payment not found');
    const delta = input.amount - payment.amount; // extra paid reduces balance further
    return prisma.$transaction(async (tx) => {
      if (payment.type === 'VENDOR_PAYMENT' && payment.vendorId) {
        await tx.vendor.update({ where: { id: payment.vendorId }, data: { balance: { decrement: delta } } });
      }
      if (payment.type === 'DEALER_RECEIPT' && payment.dealerId) {
        await tx.dealer.update({ where: { id: payment.dealerId }, data: { balance: { decrement: delta } } });
      }
      return tx.payment.update({
        where: { id },
        data: {
          amount: input.amount,
          method: input.method,
          paymentDate: input.paymentDate ?? payment.paymentDate,
          notes: (input.notes ?? '').toString().trim() || null,
        },
        include: { vendor: { select: { id: true, name: true } }, dealer: { select: { id: true, name: true } } },
      });
    });
  },

  async remove(id: string) {
    const payment = await paymentRepository.findById(id);
    if (!payment) throw ApiError.notFound('Payment not found');

    await prisma.$transaction(async (tx) => {
      // Reverse the balance change
      if (payment.type === 'VENDOR_PAYMENT' && payment.vendorId) {
        await tx.vendor.update({ where: { id: payment.vendorId }, data: { balance: { increment: payment.amount } } });
      }
      if (payment.type === 'DEALER_RECEIPT' && payment.dealerId) {
        await tx.dealer.update({ where: { id: payment.dealerId }, data: { balance: { increment: payment.amount } } });
      }
      await tx.payment.delete({ where: { id } });
    });
  },
};
