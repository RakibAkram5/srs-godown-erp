import * as XLSX from 'xlsx';
import type { VendorLedger, DealerLedger } from '@/types';
import { formatDate } from '@/utils/formatters';

const vendorTypeLabel: Record<string, string> = { PURCHASE: 'Purchase', RETURN: 'Return', PAYMENT: 'Payment' };
const dealerTypeLabel: Record<string, string> = { SALE: 'Sale', RETURN: 'Return', RECEIPT: 'Receipt' };

function download(rows: Record<string, unknown>[], sheet: string, file: string) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheet);
  XLSX.writeFile(wb, file);
}

// Vendor is a payable: purchases are Credit, payments/returns are Debit.
export function exportVendorLedgerExcel(ledger: VendorLedger) {
  const rows: Record<string, unknown>[] = [
    { Date: '', Type: 'Opening balance', Reference: '', Debit: '', Credit: '', Balance: ledger.openingBalance },
  ];
  for (const e of ledger.entries) {
    const credit = e.amount >= 0 ? e.amount : '';
    const debit = e.amount < 0 ? -e.amount : '';
    rows.push({
      Date: formatDate(e.date),
      Type: vendorTypeLabel[e.type] ?? e.type,
      Reference: e.reference ?? '',
      Debit: debit,
      Credit: credit,
      Balance: e.balance,
    });
  }
  download(rows, 'Vendor Ledger', `vendor-ledger-${ledger.vendor.name}.xlsx`);
}

// Dealer is a receivable: sales are Debit, receipts/returns are Credit.
export function exportDealerLedgerExcel(ledger: DealerLedger) {
  const rows: Record<string, unknown>[] = [
    { Date: '', Type: 'Opening balance', Reference: '', Debit: '', Credit: '', Balance: ledger.openingBalance },
  ];
  for (const e of ledger.entries) {
    const debit = e.amount >= 0 ? e.amount : '';
    const credit = e.amount < 0 ? -e.amount : '';
    rows.push({
      Date: formatDate(e.date),
      Type: dealerTypeLabel[e.type] ?? e.type,
      Reference: e.reference ?? '',
      Debit: debit,
      Credit: credit,
      Balance: e.balance,
    });
  }
  download(rows, 'Dealer Ledger', `dealer-ledger-${ledger.dealer.name}.xlsx`);
}
