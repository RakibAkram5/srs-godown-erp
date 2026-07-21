import { Prisma } from '@prisma/client';
import { vendorRepository } from '@/repositories/vendor.repository';
import { prisma } from '@/config/prisma';
import { ApiError } from '@/utils/apiError';
import type { VendorInput } from '@/validators/vendor.validator';

function clean(v?: string | null) {
  const t = (v ?? '').toString().trim();
  return t.length ? t : null;
}

export const vendorService = {
  async list(search?: string, status?: string) {
    const where: Prisma.VendorWhereInput = { isDeleted: false };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;
    return vendorRepository.list(where);
  },

  async get(id: string) {
    const vendor = await vendorRepository.findById(id);
    if (!vendor || vendor.isDeleted) throw ApiError.notFound('Vendor not found');
    return vendor;
  },

  async create(input: VendorInput) {
    const opening = input.openingBalance ?? 0;
    return vendorRepository.create({
      name: input.name.trim(),
      phone: clean(input.phone),
      email: clean(input.email),
      address: clean(input.address),
      openingBalance: opening,
      balance: opening,
      isActive: input.isActive ?? true,
    });
  },

  async update(id: string, input: VendorInput) {
    const vendor = await this.get(id);
    // Adjust outstanding balance by the change in opening balance.
    const newOpening = input.openingBalance ?? 0;
    const delta = newOpening - vendor.openingBalance;
    return vendorRepository.update(id, {
      name: input.name.trim(),
      phone: clean(input.phone),
      email: clean(input.email),
      address: clean(input.address),
      openingBalance: newOpening,
      balance: vendor.balance + delta,
      isActive: input.isActive ?? true,
    });
  },

  async setStatus(id: string, isActive: boolean) {
    await this.get(id);
    return vendorRepository.update(id, { isActive });
  },

  async remove(id: string) {
    await this.get(id);
    const purchaseCount = await prisma.purchase.count({ where: { vendorId: id } });
    if (purchaseCount > 0) {
      throw ApiError.badRequest('Cannot delete a vendor that has purchases. Mark it inactive instead.');
    }
    await vendorRepository.update(id, { isDeleted: true, isActive: false });
  },

  // Vendor purchase history + outstanding.
  async history(id: string) {
    const vendor = await this.get(id);
    const purchases = await prisma.purchase.findMany({
      where: { vendorId: id },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { items: { select: { productName: true, quantity: true } } },
    });
    return { vendor, purchases };
  },

  // Full ledger: purchases (+), purchase returns (-), payments (-), running balance.
  async ledger(id: string) {
    const vendor = await this.get(id);

    const purchases = await prisma.purchase.findMany({
      where: { vendorId: id, status: 'COMPLETED' },
      select: { purchaseNo: true, purchaseDate: true, totalAmount: true, paidAmount: true },
    });
    const returns = await prisma.purchaseReturn.findMany({
      where: { vendorId: id },
      select: { returnNo: true, returnDate: true, totalAmount: true },
    });
    const payments = await prisma.payment.findMany({
      where: { vendorId: id, type: 'VENDOR_PAYMENT' },
      select: { voucherNo: true, paymentDate: true, amount: true },
    });
    const adjustments = await prisma.adjustment.findMany({
      where: { vendorId: id },
      select: { adjustmentNo: true, adjustmentDate: true, amount: true, reason: true },
    });

    type Entry = { date: Date; type: 'PURCHASE' | 'RETURN' | 'PAYMENT' | 'ADJUSTMENT'; reference: string | null; amount: number; balance: number };
    const raw: Omit<Entry, 'balance'>[] = [
      ...purchases.map((p) => ({ date: p.purchaseDate, type: 'PURCHASE' as const, reference: p.purchaseNo, amount: p.totalAmount })),
      // Amount paid at the time of purchase reduces what we owe.
      ...purchases
        .filter((p) => p.paidAmount > 0)
        .map((p) => ({ date: p.purchaseDate, type: 'PAYMENT' as const, reference: `${p.purchaseNo} (paid)`, amount: -p.paidAmount })),
      ...returns.map((r) => ({ date: r.returnDate, type: 'RETURN' as const, reference: r.returnNo, amount: -r.totalAmount })),
      ...payments.map((pm) => ({ date: pm.paymentDate, type: 'PAYMENT' as const, reference: pm.voucherNo, amount: -pm.amount })),
      ...adjustments.map((a) => ({ date: a.adjustmentDate, type: 'ADJUSTMENT' as const, reference: a.reason || a.adjustmentNo, amount: a.amount })),
    ];
    raw.sort((a, b) => a.date.getTime() - b.date.getTime());

    let running = vendor.openingBalance;
    const entries: Entry[] = raw.map((e) => {
      running += e.amount;
      return { ...e, balance: running };
    });

    return { vendor, openingBalance: vendor.openingBalance, entries };
  },

  // Manual outstanding balance adjustment (+ increases what we owe, - decreases).
  async adjust(id: string, amount: number, reason: string) {
    const vendor = await this.get(id);
    if (!amount || amount === 0) throw ApiError.badRequest('Adjustment amount cannot be zero');
    if (!reason?.trim()) throw ApiError.badRequest('A reason is required');
    return prisma.$transaction(async (tx) => {
      const created = await tx.adjustment.create({
        data: { vendorId: vendor.id, amount, reason: reason.trim() },
      });
      const withNo = await tx.adjustment.update({
        where: { id: created.id },
        data: { adjustmentNo: `ADJ-${String(created.codeNo).padStart(5, '0')}` },
      });
      await tx.vendor.update({ where: { id: vendor.id }, data: { balance: { increment: amount } } });
      return withNo;
    });
  },
};
