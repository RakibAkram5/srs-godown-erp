import * as XLSX from 'xlsx';
import type { Purchase } from '@/types';
import { formatDate } from '@/utils/formatters';

export function exportVendorPurchasesExcel(vendorName: string, purchases: Purchase[]) {
  const rows = purchases.map((p) => ({
    'Bill No': p.purchaseNo ?? '',
    Date: formatDate(p.purchaseDate),
    Status: p.status === 'COMPLETED' ? 'Completed' : 'Draft',
    Products: (p.items ?? []).map((it) => `${it.productName} x${it.quantity}`).join(', '),
    'Bill Amount': p.totalAmount,
    Paid: p.paidAmount,
    Remaining: Math.max(0, p.totalAmount - p.paidAmount),
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Purchases');
  XLSX.writeFile(wb, `vendor-purchases-${vendorName}.xlsx`);
}
