import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { Sale } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface DocMeta {
  companyName: string;
  currency: string;
}

export function saleInvoicePdf(sale: Sale, meta: DocMeta) {
  const doc = new jsPDF();
  const currency = meta.currency;

  doc.setFontSize(18);
  doc.text(meta.companyName, 14, 18);
  doc.setFontSize(11);
  doc.setTextColor(120);
  doc.text('Sale Invoice', 14, 25);

  doc.setTextColor(20);
  doc.setFontSize(10);
  doc.text(`Bill No: ${sale.saleNo ?? '-'}`, 14, 36);
  doc.text(`Date: ${formatDate(sale.saleDate)}`, 14, 42);
  let infoY = 48;
  if (sale.dealer) {
    doc.text(`Dealer: ${sale.dealer.name}`, 14, infoY); infoY += 6;
    if (sale.dealer.city) { doc.text(`City: ${sale.dealer.city}`, 14, infoY); infoY += 6; }
    if (sale.dealer.phone) { doc.text(`Phone: ${sale.dealer.phone}`, 14, infoY); infoY += 6; }
  } else {
    doc.text(`Customer: ${sale.customerName || 'Walk-in'}`, 14, infoY); infoY += 6;
  }
  doc.text(`Status: ${sale.status}`, 140, 36);

  const body = (sale.items ?? []).map((it, i) => [
    i + 1,
    it.productName,
    it.quantity,
    formatCurrency(it.salePrice, currency),
    formatCurrency(it.discount, currency),
    formatCurrency(Math.max(0, it.quantity * it.salePrice - it.discount), currency),
  ]);

  autoTable(doc, {
    startY: infoY + 4,
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
  doc.text(`Sub total: ${formatCurrency(sale.subTotal, currency)}`, right, endY, { align: 'right' });
  doc.text(`Discount: ${formatCurrency(sale.discount, currency)}`, right, endY + 6, { align: 'right' });
  doc.text(`Tax: ${formatCurrency(sale.taxAmount, currency)}`, right, endY + 12, { align: 'right' });
  doc.setFontSize(11);
  doc.text(`Bill total: ${formatCurrency(sale.totalAmount, currency)}`, right, endY + 20, { align: 'right' });
  const remaining = Math.max(0, sale.totalAmount - sale.paidAmount);
  doc.setFontSize(10);
  doc.text(`Paid: ${formatCurrency(sale.paidAmount, currency)}`, right, endY + 27, { align: 'right' });
  doc.text(`Remaining (this bill): ${formatCurrency(remaining, currency)}`, right, endY + 33, { align: 'right' });
  doc.text(`Previous balance: ${formatCurrency(sale.previousBalance, currency)}`, right, endY + 39, { align: 'right' });
  doc.setFontSize(12);
  doc.text(`Grand total payable: ${formatCurrency(sale.previousBalance + remaining, currency)}`, right, endY + 47, { align: 'right' });

  if (sale.notes) {
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Notes: ${sale.notes}`, 14, endY + 20);
  }

    doc.setFontSize(8);
  doc.setTextColor(130);
  doc.text('Developed by SRS Matrix  |  Contact: 03014334151', 105, 290, { align: 'center' });
  doc.save(`${sale.saleNo ?? 'sale'}.pdf`);
}

export function exportSalesExcel(sales: Sale[], fileName = 'sales.xlsx') {
  const rows = sales.map((s) => ({
    'Sale No': s.saleNo ?? '',
    Date: formatDate(s.saleDate),
    Customer: s.customerName || 'Walk-in',
    Items: s._count?.items ?? s.items?.length ?? 0,
    'Sub Total': s.subTotal,
    Discount: s.discount,
    Tax: s.taxAmount,
    Total: s.totalAmount,
    Status: s.status,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sales');
  XLSX.writeFile(wb, fileName);
}
