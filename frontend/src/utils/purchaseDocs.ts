import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { Purchase } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface DocMeta {
  companyName: string;
  currency: string;
}

export function purchaseInvoicePdf(purchase: Purchase, meta: DocMeta) {
  const doc = new jsPDF();
  const currency = meta.currency;

  doc.setFontSize(18);
  doc.text(meta.companyName, 14, 18);
  doc.setFontSize(11);
  doc.setTextColor(120);
  doc.text('Purchase Invoice', 14, 25);

  doc.setTextColor(20);
  doc.setFontSize(10);
  doc.text(`Purchase No: ${purchase.purchaseNo ?? '-'}`, 14, 36);
  doc.text(`Date: ${formatDate(purchase.purchaseDate)}`, 14, 42);
  doc.text(`Vendor: ${purchase.vendor?.name ?? '-'}`, 14, 48);
  doc.text(`Status: ${purchase.status}`, 140, 36);

  const body = (purchase.items ?? []).map((it, i) => [
    i + 1,
    it.productName,
    it.quantity,
    formatCurrency(it.purchasePrice, currency),
    formatCurrency(it.discount, currency),
    formatCurrency(Math.max(0, it.quantity * it.purchasePrice - it.discount), currency),
  ]);

  autoTable(doc, {
    startY: 56,
    head: [['#', 'Product', 'Qty', 'Price', 'Discount', 'Total']],
    body,
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235] },
    styles: { fontSize: 9 },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const endY = (doc as any).lastAutoTable.finalY + 8;
  const right = 196;
  doc.setFontSize(10);
  doc.text(`Sub total: ${formatCurrency(purchase.subTotal, currency)}`, right, endY, { align: 'right' });
  doc.text(`Discount: ${formatCurrency(purchase.discount, currency)}`, right, endY + 6, { align: 'right' });
  doc.text(`Tax: ${formatCurrency(purchase.taxAmount, currency)}`, right, endY + 12, { align: 'right' });
  doc.setFontSize(12);
  doc.text(`Total: ${formatCurrency(purchase.totalAmount, currency)}`, right, endY + 20, { align: 'right' });

  if (purchase.notes) {
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Notes: ${purchase.notes}`, 14, endY + 20);
  }

    doc.setFontSize(8);
  doc.setTextColor(130);
  doc.text('Developed by SRS Matrix  |  Contact: 03014334151', 105, 290, { align: 'center' });
  doc.save(`${purchase.purchaseNo ?? 'purchase'}.pdf`);
}

export function exportPurchasesExcel(purchases: Purchase[], fileName = 'purchases.xlsx') {
  const rows = purchases.map((p) => ({
    'Purchase No': p.purchaseNo ?? '',
    Date: formatDate(p.purchaseDate),
    Vendor: p.vendor?.name ?? '',
    Items: p._count?.items ?? p.items?.length ?? 0,
    'Sub Total': p.subTotal,
    Discount: p.discount,
    Tax: p.taxAmount,
    Total: p.totalAmount,
    Status: p.status,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Purchases');
  XLSX.writeFile(wb, fileName);
}
