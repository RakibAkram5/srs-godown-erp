import { Prisma } from '@prisma/client';
import { dealerRepository } from '@/repositories/dealer.repository';
import { prisma } from '@/config/prisma';
import { ApiError } from '@/utils/apiError';
import type { DealerInput } from '@/validators/dealer.validator';

function clean(v?: string | null) {
  const t = (v ?? '').toString().trim();
  return t.length ? t : null;
}

export const dealerService = {
  async list(search?: string, status?: string) {
    const where: Prisma.DealerWhereInput = { isDeleted: false };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;
    return dealerRepository.list(where);
  },

  async get(id: string) {
    const dealer = await dealerRepository.findById(id);
    if (!dealer || dealer.isDeleted) throw ApiError.notFound('Dealer not found');
    return dealer;
  },

  async create(input: DealerInput) {
    const opening = input.openingBalance ?? 0;
    return dealerRepository.create({
      name: input.name.trim(),
      phone: clean(input.phone),
      email: clean(input.email),
      address: clean(input.address),
      city: clean(input.city),
      openingBalance: opening,
      balance: opening,
      isActive: input.isActive ?? true,
    });
  },

  async update(id: string, input: DealerInput) {
    const dealer = await this.get(id);
    const newOpening = input.openingBalance ?? 0;
    const delta = newOpening - dealer.openingBalance;
    return dealerRepository.update(id, {
      name: input.name.trim(),
      phone: clean(input.phone),
      email: clean(input.email),
      address: clean(input.address),
      city: clean(input.city),
      openingBalance: newOpening,
      balance: dealer.balance + delta,
      isActive: input.isActive ?? true,
    });
  },

  async setStatus(id: string, isActive: boolean) {
    await this.get(id);
    return dealerRepository.update(id, { isActive });
  },

  async remove(id: string) {
    await this.get(id);
    const saleCount = await prisma.sale.count({ where: { dealerId: id } });
    if (saleCount > 0) {
      throw ApiError.badRequest('Cannot delete a dealer that has sales. Mark it inactive instead.');
    }
    await dealerRepository.update(id, { isDeleted: true, isActive: false });
  },

  // Ledger: completed sales (increase) + sale returns (decrease) with running balance.
  async ledger(id: string) {
    const dealer = await this.get(id);

    const sales = await prisma.sale.findMany({
      where: { dealerId: id, status: 'COMPLETED' },
      select: { saleNo: true, saleDate: true, totalAmount: true, paidAmount: true },
    });
    const returns = await prisma.saleReturn.findMany({
      where: { sale: { dealerId: id } },
      select: { returnNo: true, returnDate: true, totalAmount: true },
    });
    const receipts = await prisma.payment.findMany({
      where: { dealerId: id, type: 'DEALER_RECEIPT' },
      select: { voucherNo: true, paymentDate: true, amount: true },
    });

    type Entry = { date: Date; type: 'SALE' | 'RETURN' | 'RECEIPT'; reference: string | null; amount: number; balance: number };
    const raw: Omit<Entry, 'balance'>[] = [
      ...sales.map((s) => ({ date: s.saleDate, type: 'SALE' as const, reference: s.saleNo, amount: s.totalAmount })),
      // Amount paid at the time of sale is a receipt against the balance.
      ...sales
        .filter((s) => s.paidAmount > 0)
        .map((s) => ({ date: s.saleDate, type: 'RECEIPT' as const, reference: `${s.saleNo} (paid)`, amount: -s.paidAmount })),
      ...returns.map((r) => ({ date: r.returnDate, type: 'RETURN' as const, reference: r.returnNo, amount: -r.totalAmount })),
      ...receipts.map((rc) => ({ date: rc.paymentDate, type: 'RECEIPT' as const, reference: rc.voucherNo, amount: -rc.amount })),
    ];
    raw.sort((a, b) => a.date.getTime() - b.date.getTime());

    let running = dealer.openingBalance;
    const entries: Entry[] = raw.map((e) => {
      running += e.amount;
      return { ...e, balance: running };
    });

    return { dealer, openingBalance: dealer.openingBalance, entries };
  },
};
