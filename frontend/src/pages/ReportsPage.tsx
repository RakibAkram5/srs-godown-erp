import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Clock, Download, ReceiptText, ShoppingCart } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { salesApi } from '@/services/sales.service';
import { purchasesApi } from '@/services/purchases.service';
import { reportsApi } from '@/services/reports.service';
import { settingsService } from '@/services/settings.service';
import { exportSalesReport, exportPurchasesReport, exportPendingLedgerReport } from '@/utils/reportExports';
import { toast } from '@/utils/toast';

type ReportKey = 'sales' | 'purchases' | 'pending';

const reports: { key: ReportKey; title: string; description: string; icon: typeof ReceiptText }[] = [
  { key: 'sales', title: 'Sales Report', description: 'All sales with customer, totals, paid and remaining amounts.', icon: ReceiptText },
  { key: 'purchases', title: 'Purchase Report', description: 'All purchases with vendor, totals, paid and credit amounts.', icon: ShoppingCart },
  { key: 'pending', title: 'Pending Ledger', description: 'All unpaid & partially-paid sales invoices to collect.', icon: Clock },
];

export default function ReportsPage() {
  const [busy, setBusy] = useState<ReportKey | null>(null);
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: settingsService.get, retry: false });
  const meta = { companyName: settings?.companyName || 'SRS Traders', logoUrl: settings?.companyLogo, currency: settings?.currency ?? 'PKR' };

  async function run(key: ReportKey) {
    setBusy(key);
    try {
      if (key === 'sales') {
        const all = await salesApi.list({ page: 1, limit: 100000, sortBy: 'saleDate', sortOrder: 'desc' });
        if (all.items.length === 0) return toast.error('Nothing to export', 'No sales found.');
        await exportSalesReport(all.items, meta);
        toast.success('Sales report exported', `${all.items.length} sales.`);
      } else if (key === 'purchases') {
        const all = await purchasesApi.list({ page: 1, limit: 100000, sortBy: 'purchaseDate', sortOrder: 'desc' });
        if (all.items.length === 0) return toast.error('Nothing to export', 'No purchases found.');
        await exportPurchasesReport(all.items, meta);
        toast.success('Purchase report exported', `${all.items.length} purchases.`);
      } else {
        const all = await reportsApi.pendingLedger({ type: 'sales', page: 1, limit: 100000 });
        if (all.items.length === 0) return toast.error('Nothing to export', 'No unpaid sales.');
        await exportPendingLedgerReport(all.items, 'sales', meta);
        toast.success('Pending ledger exported', `${all.items.length} invoices.`);
      }
    } catch (err) {
      toast.error('Export failed', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Download professional Excel reports with company header, totals and formatting."
        icon={<BarChart3 className="h-5 w-5" />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.key} className="flex flex-col rounded-lg border border-border bg-card p-5">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-base font-semibold">{r.title}</p>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{r.description}</p>
              <Button className="mt-4 w-full" variant="outline" loading={busy === r.key} onClick={() => run(r.key)}>
                <Download className="h-4 w-4" />Export to Excel
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
