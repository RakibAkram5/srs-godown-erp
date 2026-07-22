import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { Purchase } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { loadLogoImage } from '@/utils/logo';

interface DocMeta {
  companyName: string;
  currency: string;
  companyLogo?: string | null;
  phone?: string | null;
  address?: string | null;
  previousBalance?: number;
}

export async function purchaseInvoicePdf(purchase: Purchase, meta: DocMeta) {
  const doc = new jsPDF();
  const currency = meta.currency;

  const logo = await loadLogoImage(meta.companyLogo);
  const textX = logo ? 40 : 14;
  if (logo) {
    try {
      doc.addImage(logo.dataUri, logo.format, 14, 10, 22, 22);
    } catch {
      // Corrupt/unsupported image data — skip silently, invoice still generates.
    }
  }

  doc.setFontSize(18);
  doc.text(meta.companyName, textX, 18);
  doc.setFontSize(11);
  doc.setTextColor(120);
  doc.text('Purchase Invoice', textX, 25);
  let headerY = 25;
  if (meta.address || meta.phone) {
    headerY += 5;
    doc.setFontSize(9);
    doc.text([meta.address, meta.phone].filter(Boolean).join('  |  '), textX, headerY);
  }

  doc.setTextColor(20);
  doc.setFontSize(10);
  let infoY = Math.max(36, headerY + 11);
  doc.text(`Purchase No: ${purchase.purchaseNo ?? '-'}`, 14, infoY);
  doc.text(`Status: ${purchase.status}`, 140, infoY);
  infoY += 6;
  doc.text(`Date: ${formatDate(purchase.purchaseDate)}`, 14, infoY);
  infoY += 6;
  doc.text(`Vendor: ${purchase.vendor?.name ?? '-'}`, 14, infoY);
  infoY += 6;

  const body = (purchase.items ?? []).map((it, i) => [
    i + 1,
    it.productName,
    it.quantity,
    formatCurrency(it.purchasePrice, currency),
    formatCurrency(it.discount, currency),
    formatCurrency(Math.max(0, it.quantity * it.purchasePrice - it.discount), currency),
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
  const previousBalance = meta.previousBalance ?? purchase.previousBalance;
  const grandTotalDue = previousBalance + purchase.totalAmount;
  const balanceDue = Math.max(0, grandTotalDue - purchase.paidAmount);

  doc.setFontSize(10);
  doc.text(`Sub total: ${formatCurrency(purchase.subTotal, currency)}`, right, endY, { align: 'right' });
  doc.text(`Discount: ${formatCurrency(purchase.discount, currency)}`, right, endY + 6, { align: 'right' });
  doc.setFontSize(11);
  doc.text(`Bill total: ${formatCurrency(purchase.totalAmount, currency)}`, right, endY + 14, { align: 'right' });
  doc.setFontSize(10);
  doc.text(`Previous balance: ${formatCurrency(previousBalance, currency)}`, right, endY + 21, { align: 'right' });
  doc.text(`Grand total payable: ${formatCurrency(grandTotalDue, currency)}`, right, endY + 27, { align: 'right' });
  doc.text(`Paid: ${formatCurrency(purchase.paidAmount, currency)}`, right, endY + 33, { align: 'right' });
  doc.setFontSize(12);
  doc.text(
    balanceDue <= 0 ? 'Balance due: Clear / Paid' : `Balance due: ${formatCurrency(balanceDue, currency)}`,
    right,
    endY + 41,
    { align: 'right' },
  );

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
    Total: p.totalAmount,
    Status: p.status,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Purchases');
  XLSX.writeFile(wb, fileName);
}
