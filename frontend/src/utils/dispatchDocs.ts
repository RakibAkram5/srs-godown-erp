import * as XLSX from 'xlsx';
import type { Dispatch } from '@/types';
import { formatDate } from '@/utils/formatters';

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
