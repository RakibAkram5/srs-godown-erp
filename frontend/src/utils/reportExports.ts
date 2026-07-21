import { exportProfessionalExcel, type ProColumn } from './proExcel';
import { formatDate } from './formatters';
import type {
  Sale, Purchase, Payment, Expense, Salary, DealerLedger, VendorLedger, FinancialReport, PendingLedgerRow,
} from '@/types';

export interface ExcelMeta {
  companyName?: string;
  logoUrl?: string | null;
  currency?: string;
}

const methodLabel = (m: string) => m.charAt(0) + m.slice(1).toLowerCase();

export function exportSalesReport(sales: Sale[], meta: ExcelMeta, filters: { label: string; value: string }[] = []) {
  const columns: ProColumn[] = [
    { header: 'Bill No', key: 'no' },
    { header: 'Date', key: 'date' },
    { header: 'Customer', key: 'customer' },
    { header: 'Qty', key: 'qty' },
    { header: 'Total', key: 'total', money: true },
    { header: 'Paid', key: 'paid', money: true },
    { header: 'Remaining', key: 'remaining', money: true },
    { header: 'Status', key: 'status' },
  ];
  const rows = sales.map((s) => ({
    no: s.saleNo ?? '', date: formatDate(s.saleDate),
    customer: s.dealer?.name || s.customerName || 'Walk-in',
    qty: s.totalQuantity ?? '', total: s.totalAmount, paid: s.paidAmount,
    remaining: Math.max(0, s.totalAmount - s.paidAmount), status: s.status,
  }));
  return exportProfessionalExcel({ fileName: 'sales-report.xlsx', sheetName: 'Sales', title: 'Sales Report', ...meta, filters, columns, rows, totalKeys: ['total', 'paid', 'remaining'] });
}

export function exportPurchasesReport(purchases: Purchase[], meta: ExcelMeta, filters: { label: string; value: string }[] = []) {
  const columns: ProColumn[] = [
    { header: 'Bill No', key: 'no' },
    { header: 'Date', key: 'date' },
    { header: 'Vendor', key: 'vendor' },
    { header: 'Qty', key: 'qty' },
    { header: 'Total', key: 'total', money: true },
    { header: 'Paid', key: 'paid', money: true },
    { header: 'Credit', key: 'remaining', money: true },
    { header: 'Status', key: 'status' },
  ];
  const rows = purchases.map((p) => ({
    no: p.purchaseNo ?? '', date: formatDate(p.purchaseDate),
    vendor: p.vendor?.name ?? '', qty: p.totalQuantity ?? '',
    total: p.totalAmount, paid: p.paidAmount,
    remaining: Math.max(0, p.totalAmount - p.paidAmount), status: p.status,
  }));
  return exportProfessionalExcel({ fileName: 'purchase-report.xlsx', sheetName: 'Purchases', title: 'Purchase Report', ...meta, filters, columns, rows, totalKeys: ['total', 'paid', 'remaining'] });
}

export function exportPendingLedgerReport(rows0: PendingLedgerRow[], type: 'sales' | 'purchases', meta: ExcelMeta, filters: { label: string; value: string }[] = []) {
  const columns: ProColumn[] = [
    { header: 'Bill No', key: 'no' },
    { header: 'Date', key: 'date' },
    { header: type === 'sales' ? 'Dealer / Customer' : 'Vendor', key: 'party' },
    { header: 'Total', key: 'total', money: true },
    { header: 'Paid', key: 'paid', money: true },
    { header: 'Remaining', key: 'remaining', money: true },
  ];
  const rows = rows0.map((r) => ({ no: r.no ?? '', date: formatDate(r.date), party: r.party, total: r.total, paid: r.paid, remaining: r.remaining }));
  return exportProfessionalExcel({ fileName: `pending-ledger-${type}.xlsx`, sheetName: 'Pending', title: `Pending Ledger — ${type === 'sales' ? 'Unpaid Sales' : 'Unpaid Purchases'}`, ...meta, filters, columns, rows, totalKeys: ['total', 'paid', 'remaining'] });
}

export function exportPaymentsReport(payments: Payment[], meta: ExcelMeta, filters: { label: string; value: string }[] = []) {
  const columns: ProColumn[] = [
    { header: 'Voucher', key: 'voucher' },
    { header: 'Date', key: 'date' },
    { header: 'Type', key: 'type' },
    { header: 'Party', key: 'party' },
    { header: 'Method', key: 'method' },
    { header: 'Amount', key: 'amount', money: true },
  ];
  const rows = payments.map((p) => ({
    voucher: p.voucherNo ?? '', date: formatDate(p.paymentDate),
    type: p.type === 'VENDOR_PAYMENT' ? 'Payment' : 'Receipt',
    party: p.vendor?.name || p.dealer?.name || '—',
    method: methodLabel(p.method), amount: p.amount,
  }));
  return exportProfessionalExcel({ fileName: 'payments-report.xlsx', sheetName: 'Payments', title: 'Payments & Receipts', ...meta, filters, columns, rows, totalKeys: ['amount'] });
}

export function exportExpensesReport(items: Expense[], meta: ExcelMeta, filters: { label: string; value: string }[] = []) {
  const columns: ProColumn[] = [
    { header: 'No', key: 'no' },
    { header: 'Date', key: 'date' },
    { header: 'Category', key: 'category' },
    { header: 'Description', key: 'description' },
    { header: 'Method', key: 'method' },
    { header: 'Amount', key: 'amount', money: true },
  ];
  const rows = items.map((e) => ({ no: e.expenseNo ?? '', date: formatDate(e.expenseDate), category: e.category, description: e.description ?? '', method: methodLabel(e.method), amount: e.amount }));
  return exportProfessionalExcel({ fileName: 'expenses-report.xlsx', sheetName: 'Expenses', title: 'Godown Expenses', ...meta, filters, columns, rows, totalKeys: ['amount'] });
}

export function exportSalariesReport(items: Salary[], meta: ExcelMeta, filters: { label: string; value: string }[] = []) {
  const columns: ProColumn[] = [
    { header: 'No', key: 'no' },
    { header: 'Employee', key: 'employee' },
    { header: 'Month', key: 'month' },
    { header: 'Amount', key: 'amount', money: true },
    { header: 'Paid', key: 'paid', money: true },
    { header: 'Remaining', key: 'remaining', money: true },
    { header: 'Paid On', key: 'paidOn' },
  ];
  const rows = items.map((s) => ({ no: s.salaryNo ?? '', employee: s.employeeName, month: s.month, amount: s.amount, paid: s.paidAmount, remaining: Math.max(0, s.amount - s.paidAmount), paidOn: s.paymentDate ? formatDate(s.paymentDate) : '' }));
  return exportProfessionalExcel({ fileName: 'salaries-report.xlsx', sheetName: 'Salaries', title: 'Salary Report', ...meta, filters, columns, rows, totalKeys: ['amount', 'paid', 'remaining'] });
}

const dealerType: Record<string, string> = { SALE: 'Sale', RETURN: 'Return', RECEIPT: 'Receipt', ADJUSTMENT: 'Adjustment' };
const vendorType: Record<string, string> = { PURCHASE: 'Purchase', RETURN: 'Return', PAYMENT: 'Payment', ADJUSTMENT: 'Adjustment' };

export function exportDealerLedgerReport(ledger: DealerLedger, meta: ExcelMeta) {
  const columns: ProColumn[] = [
    { header: 'Date', key: 'date' },
    { header: 'Type', key: 'type' },
    { header: 'Reference', key: 'reference' },
    { header: 'Debit', key: 'debit', money: true },
    { header: 'Credit', key: 'credit', money: true },
    { header: 'Balance', key: 'balance', money: true },
  ];
  const rows: Record<string, unknown>[] = [{ date: '', type: 'Opening balance', reference: '', debit: '', credit: '', balance: ledger.openingBalance }];
  for (const e of ledger.entries) {
    rows.push({ date: formatDate(e.date), type: dealerType[e.type] ?? e.type, reference: e.reference ?? '', debit: e.amount >= 0 ? e.amount : '', credit: e.amount < 0 ? -e.amount : '', balance: e.balance });
  }
  return exportProfessionalExcel({ fileName: `dealer-ledger-${ledger.dealer.name}.xlsx`, sheetName: 'Ledger', title: `Dealer Ledger — ${ledger.dealer.name}`, ...meta, filters: [{ label: 'Outstanding', value: String(ledger.dealer.balance) }], columns, rows });
}

export function exportVendorLedgerReport(ledger: VendorLedger, meta: ExcelMeta) {
  const columns: ProColumn[] = [
    { header: 'Date', key: 'date' },
    { header: 'Type', key: 'type' },
    { header: 'Reference', key: 'reference' },
    { header: 'Debit', key: 'debit', money: true },
    { header: 'Credit', key: 'credit', money: true },
    { header: 'Balance', key: 'balance', money: true },
  ];
  const rows: Record<string, unknown>[] = [{ date: '', type: 'Opening balance', reference: '', debit: '', credit: '', balance: ledger.openingBalance }];
  for (const e of ledger.entries) {
    rows.push({ date: formatDate(e.date), type: vendorType[e.type] ?? e.type, reference: e.reference ?? '', debit: e.amount < 0 ? -e.amount : '', credit: e.amount >= 0 ? e.amount : '', balance: e.balance });
  }
  return exportProfessionalExcel({ fileName: `vendor-ledger-${ledger.vendor.name}.xlsx`, sheetName: 'Ledger', title: `Vendor Ledger — ${ledger.vendor.name}`, ...meta, filters: [{ label: 'Outstanding', value: String(ledger.vendor.balance) }], columns, rows });
}

export function exportFinancialReport(r: FinancialReport, meta: ExcelMeta) {
  const columns: ProColumn[] = [
    { header: 'Item', key: 'item' },
    { header: 'Amount', key: 'amount', money: true },
  ];
  const rows: Record<string, unknown>[] = [
    { item: 'Sales (income)', amount: r.sales.total },
    { item: 'Purchases (cost)', amount: r.purchases.total },
    { item: 'Expenses', amount: r.expenses.total },
    { item: 'Salaries', amount: r.salaries.total },
    { item: 'NET PROFIT', amount: r.netProfit },
    { item: 'Receivable (dealers)', amount: r.outstanding.receivable },
    { item: 'Payable (vendors)', amount: r.outstanding.payable },
    { item: 'Pending value', amount: r.pending.value },
    ...r.expenses.byCategory.map((c) => ({ item: `Expense — ${c.category}`, amount: c.amount })),
  ];
  return exportProfessionalExcel({
    fileName: 'financial-report.xlsx', sheetName: 'P&L', title: 'Financial Report (Profit & Loss)', ...meta,
    filters: [{ label: 'Period', value: `${formatDate(r.period.from)} to ${formatDate(r.period.to)}` }],
    columns, rows,
  });
}
