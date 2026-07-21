import { prisma } from '@/config/prisma';

export interface FinancialQuery {
  from?: string;
  to?: string;
}

export interface PendingLedgerQuery {
  type?: 'sales' | 'purchases';
  search?: string;
  from?: string;
  to?: string;
  status?: 'all' | 'unpaid' | 'partial';
  page?: number;
  limit?: number;
}

function range(query: FinancialQuery) {
  const now = new Date();
  const from = query.from ? new Date(query.from) : new Date(now.getFullYear(), 0, 1);
  const to = query.to ? new Date(`${query.to}T23:59:59`) : now;
  return { from, to };
}

export const reportService = {
  async pendingLedger(query: PendingLedgerQuery) {
    const type = query.type === 'purchases' ? 'purchases' : 'sales';
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(1000, Math.max(1, Number(query.limit) || 12));
    const search = (query.search ?? '').trim();

    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (query.from) dateFilter.gte = new Date(query.from);
    if (query.to) dateFilter.lte = new Date(`${query.to}T23:59:59`);

    let list: {
      id: string; no: string | null; date: Date; party: string;
      total: number; paid: number; remaining: number;
    }[] = [];

    if (type === 'sales') {
      const where: Record<string, unknown> = { status: 'COMPLETED' };
      if (dateFilter.gte || dateFilter.lte) where.saleDate = dateFilter;
      if (search) {
        where.OR = [
          { saleNo: { contains: search, mode: 'insensitive' } },
          { customerName: { contains: search, mode: 'insensitive' } },
          { dealer: { name: { contains: search, mode: 'insensitive' } } },
        ];
      }
      const rows = await prisma.sale.findMany({
        where,
        include: { dealer: { select: { name: true } } },
        orderBy: { saleDate: 'desc' },
      });
      list = rows.map((r) => ({
        id: r.id, no: r.saleNo, date: r.saleDate,
        party: r.dealer?.name || r.customerName || 'Walk-in',
        total: r.totalAmount, paid: r.paidAmount, remaining: r.totalAmount - r.paidAmount,
      }));
    } else {
      const where: Record<string, unknown> = { status: 'COMPLETED' };
      if (dateFilter.gte || dateFilter.lte) where.purchaseDate = dateFilter;
      if (search) {
        where.OR = [
          { purchaseNo: { contains: search, mode: 'insensitive' } },
          { vendor: { name: { contains: search, mode: 'insensitive' } } },
        ];
      }
      const rows = await prisma.purchase.findMany({
        where,
        include: { vendor: { select: { name: true } } },
        orderBy: { purchaseDate: 'desc' },
      });
      list = rows.map((r) => ({
        id: r.id, no: r.purchaseNo, date: r.purchaseDate,
        party: r.vendor?.name ?? '—',
        total: r.totalAmount, paid: r.paidAmount, remaining: r.totalAmount - r.paidAmount,
      }));
    }

    // Only unpaid/partial invoices
    list = list.filter((r) => r.remaining > 0.009);
    if (query.status === 'unpaid') list = list.filter((r) => r.paid <= 0.009);
    else if (query.status === 'partial') list = list.filter((r) => r.paid > 0.009);

    const totalRemaining = list.reduce((s, r) => s + r.remaining, 0);
    const total = list.length;
    const items = list.slice((page - 1) * limit, page * limit);
    return { type, items, total, page, limit, pageCount: Math.max(1, Math.ceil(total / limit)), totalRemaining };
  },

  async financial(query: FinancialQuery) {
    const { from, to } = range(query);
    const fromMonth = from.toISOString().slice(0, 7);
    const toMonth = to.toISOString().slice(0, 7);

    const [salesAgg, purchasesAgg, expensesAgg, expenseGroups, salaryAgg, dealerAgg, vendorAgg, pendingItems] =
      await Promise.all([
        prisma.sale.aggregate({
          where: { status: 'COMPLETED', saleDate: { gte: from, lte: to } },
          _sum: { totalAmount: true, paidAmount: true },
          _count: true,
        }),
        prisma.purchase.aggregate({
          where: { status: 'COMPLETED', purchaseDate: { gte: from, lte: to } },
          _sum: { totalAmount: true, paidAmount: true },
          _count: true,
        }),
        prisma.expense.aggregate({
          where: { expenseDate: { gte: from, lte: to } },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.expense.groupBy({
          by: ['category'],
          where: { expenseDate: { gte: from, lte: to } },
          _sum: { amount: true },
        }),
        prisma.salary.aggregate({
          where: { month: { gte: fromMonth, lte: toMonth } },
          _sum: { amount: true, paidAmount: true },
          _count: true,
        }),
        prisma.dealer.aggregate({ where: { isDeleted: false }, _sum: { balance: true } }),
        prisma.vendor.aggregate({ where: { isDeleted: false }, _sum: { balance: true } }),
        prisma.saleItem.findMany({
          where: { pendingQuantity: { gt: 0 }, sale: { status: 'COMPLETED' } },
          select: { pendingQuantity: true, salePrice: true },
        }),
      ]);

    const salesTotal = salesAgg._sum.totalAmount ?? 0;
    const purchasesTotal = purchasesAgg._sum.totalAmount ?? 0;
    const expensesTotal = expensesAgg._sum.amount ?? 0;
    const salariesTotal = salaryAgg._sum.amount ?? 0;
    const pendingValue = pendingItems.reduce((s, i) => s + i.pendingQuantity * i.salePrice, 0);
    const netProfit = salesTotal - purchasesTotal - expensesTotal - salariesTotal;

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      sales: { count: salesAgg._count, total: salesTotal, received: salesAgg._sum.paidAmount ?? 0 },
      purchases: { count: purchasesAgg._count, total: purchasesTotal, paid: purchasesAgg._sum.paidAmount ?? 0 },
      expenses: {
        count: expensesAgg._count,
        total: expensesTotal,
        byCategory: expenseGroups
          .map((g) => ({ category: g.category, amount: g._sum.amount ?? 0 }))
          .sort((a, b) => b.amount - a.amount),
      },
      salaries: { count: salaryAgg._count, total: salariesTotal, paid: salaryAgg._sum.paidAmount ?? 0 },
      outstanding: { receivable: dealerAgg._sum.balance ?? 0, payable: vendorAgg._sum.balance ?? 0 },
      pending: { count: pendingItems.length, value: pendingValue },
      netProfit,
    };
  },
};
