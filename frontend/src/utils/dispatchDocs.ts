import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import type { Dispatch } from '@/types';
import { formatDate } from '@/utils/formatters';

interface DispatchDocMeta {
  companyName: string;
  companyLogo?: string | null;
}

function imageFormat(dataUri: string): 'PNG' | 'JPEG' {
  return dataUri.includes('image/png') ? 'PNG' : 'JPEG';
}

export function dispatchPdf(dispatch: Dispatch, meta: DispatchDocMeta) {
  const doc = new jsPDF();
  const textX = meta.companyLogo ? 40 : 14;

  if (meta.companyLogo) {
    try {
      doc.addImage(meta.companyLogo, imageFormat(meta.companyLogo), 14, 10, 22, 22);
    } catch {
      // Corrupt/unsupported image data — skip silently, document still generates.
    }
  }

  doc.setFontSize(18);
  doc.text(meta.companyName, textX, 18);
  doc.setFontSize(11);
  doc.setTextColor(120);
  doc.text('Dispatch / Bilty Record', textX, 25);

  doc.setTextColor(20);
  doc.setFontSize(10);
  let y = 44;
  const line = (label: string, value: string) => { doc.text(`${label}: ${value}`, 14, y); y += 6; };
  line('Dispatch No', dispatch.dispatchNo ?? '-');
  line('Bilty No', dispatch.biltyNumber);
  line('Date', formatDate(dispatch.dispatchDate));
  line('City', dispatch.city);
  line('Transporter', dispatch.transporterName);
  line('Invoice', dispatch.sale?.saleNo ?? '-');
  line('Dealer/Customer', dispatch.sale?.dealer?.name || dispatch.sale?.customerName || 'Walk-in');
  if (dispatch.notes) line('Notes', dispatch.notes);

  if (dispatch.images.length > 0) {
    y += 4;
    doc.setFontSize(11);
    doc.setTextColor(20);
    doc.text('Bilty images', 14, y);
    y += 6;

    const imgW = 85;
    const imgH = 65;
    const gap = 6;
    let x = 14;
    let col = 0;
    for (const src of dispatch.images) {
      if (y + imgH > 280) { doc.addPage(); y = 20; x = 14; col = 0; }
      try {
        doc.addImage(src, imageFormat(src), x, y, imgW, imgH);
      } catch {
        // Corrupt/unsupported image data — skip this image, keep going.
      }
      col += 1;
      if (col === 2) { col = 0; x = 14; y += imgH + gap; }
      else { x = 14 + imgW + gap; }
    }
  }

  doc.setFontSize(8);
  doc.setTextColor(130);
  doc.text('Developed by SRS Matrix  |  Contact: 03014334151', 105, 290, { align: 'center' });
  doc.save(`${dispatch.dispatchNo ?? 'dispatch'}.pdf`);
}

export function exportDispatchesExcel(dispatches: Dispatch[], fileName = 'dispatches.xlsx') {
  const rows = dispatches.map((d) => ({
    'Dispatch No': d.dispatchNo ?? '',
    Date: formatDate(d.dispatchDate),
    'Invoice No': d.sale?.saleNo ?? '',
    Customer: d.sale?.dealer?.name || d.sale?.customerName || 'Walk-in',
    'Bilty Number': d.biltyNumber,
    Transporter: d.transporterName,
    City: d.city,
    Notes: d.notes ?? '',
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Dispatches');
  XLSX.writeFile(wb, fileName);
}
