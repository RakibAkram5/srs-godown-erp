import { prisma } from '@/config/prisma';

function startOfToday() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function startOfMonth() { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); }

export const dashboardService = {
  async stats(role: string) {
    const isAdmin = role === 'ADMIN';
    const today = startOfToday();
    const monthStart = startOfMonth();

    // Products / stock (fetch minimal fields, compute in JS to compare two columns)
    const products = await prisma.product.findMany({
      where: { isDeleted: false },
      select: { currentStock: true, minimumStock: true },
    });
    const totalProducts = products.length;
    const totalStock = products.reduce((s, p) => s + p.currentStock, 0);
    const outOfStock = products.filter((p) => p.currentStock <= 0).length;
    const lowStock = products.filter((p) => p.currentStock > 0 && p.minimumStock > 0 && p.currentStock <= p.minimumStock).length;

    // Sales today / month
    const [todayAgg, monthAgg, weekSales] = await Promise.all([
      prisma.sale.aggregate({ where: { status: 'COMPLETED', saleDate: { gte: today } }, _sum: { totalAmount: true }, _count: true }),
      prisma.sale.aggregate({ where: { status: 'COMPLETED', saleDate: { gte: monthStart } }, _sum: { totalAmount: true }, _count: true }),
      prisma.sale.findMany({
        where: { status: 'COMPLETED', saleDate: { gte: new Date(Date.now() - 6 * 864e5) } },
        select: { saleDate: true, totalAmount: true },
      }),
    ]);

    // Last-7-days trend
    const trend: { name: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(); day.setHours(0, 0, 0, 0); day.setDate(day.getDate() - i);
      const next = new Date(day); next.setDate(day.getDate() + 1);
      const value = weekSales.filter((s) => s.saleDate >= day && s.saleDate < next).reduce((a, s) => a + s.totalAmount, 0);
      trend.push({ name: day.toLocaleDateString('en-US', { weekday: 'short' }), value });
    }

    const base = {
      totalProducts,
      totalStock,
      lowStock,
      outOfStock,
      todaySales: todayAgg._sum.totalAmount ?? 0,
      todaySalesCount: todayAgg._count,
      monthSales: monthAgg._sum.totalAmount ?? 0,
      monthSalesCount: monthAgg._count,
      salesTrend: trend,
    };

    if (!isAdmin) return { ...base, admin: false };

    // Admin-only financial figures
    const [dealerAgg, vendorAgg, monthPurchases, monthExpenses, monthSalaries, unpaidSales, recentSales] = await Promise.all([
      prisma.dealer.aggregate({ where: { isDeleted: false }, _sum: { balance: true } }),
      prisma.vendor.aggregate({ where: { isDeleted: false }, _sum: { balance: true } }),
      prisma.purchase.aggregate({ where: { status: 'COMPLETED', purchaseDate: { gte: monthStart } }, _sum: { totalAmount: true } }),
      prisma.expense.aggregate({ where: { expenseDate: { gte: monthStart } }, _sum: { amount: true } }),
      prisma.salary.aggregate({ where: { month: monthStart.toISOString().slice(0, 7) }, _sum: { amount: true } }),
      prisma.sale.findMany({ where: { status: 'COMPLETED' }, select: { totalAmount: true, paidAmount: true } }),
      prisma.sale.findMany({
        where: { status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: { saleNo: true, saleDate: true, totalAmount: true, customerName: true, dealer: { select: { name: true } } },
      }),
    ]);

    const receivable = dealerAgg._sum.balance ?? 0;
    const payable = vendorAgg._sum.balance ?? 0;
    const monthPurch = monthPurchases._sum.totalAmount ?? 0;
    const monthExp = monthExpenses._sum.amount ?? 0;
    const monthSal = monthSalaries._sum.amount ?? 0;
    const pendingReceivable = unpaidSales.reduce((s, r) => s + Math.max(0, r.totalAmount - r.paidAmount), 0);
    const netProfitMonth = (monthAgg._sum.totalAmount ?? 0) - monthPurch - monthExp - monthSal;

    return {
      ...base,
      admin: true,
      receivable,
      payable,
      pendingReceivable,
      monthPurchases: monthPurch,
      monthExpenses: monthExp,
      monthSalaries: monthSal,
      netProfitMonth,
      recentSales: recentSales.map((s) => ({
        no: s.saleNo,
        date: s.saleDate,
        amount: s.totalAmount,
        party: s.dealer?.name || s.customerName || 'Walk-in',
      })),
    };
  },
};
