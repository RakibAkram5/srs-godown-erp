import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Download, ReceiptText, ShoppingCart } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchBar } from '@/components/common/SearchBar';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { reportsApi } from '@/services/reports.service';
import { settingsService } from '@/services/settings.service';
import { exportPendingLedgerReport } from '@/utils/reportExports';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { toast } from '@/utils/toast';
import { cn } from '@/lib/utils';

type Tab = 'sales' | 'purchases';
const PAGE_SIZE = 12;

export default function PendingLedgerPage() {
  const [tab, setTab] = useState<Tab>('sales');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => setPage(1), [tab, from, to, status]);

  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: settingsService.get, retry: false });
  const currency = settings?.currency ?? 'PKR';
  const meta = { companyName: settings?.companyName || 'SRS Traders', logoUrl: settings?.companyLogo, currency };

  const params = { type: tab, search: debounced || undefined, from: from || undefined, to: to || undefined, status, page, limit: PAGE_SIZE };
  const { data, isLoading } = useQuery({ queryKey: ['pending-ledger', params], queryFn: () => reportsApi.pendingLedger(params) });

  async function handleExport() {
    try {
      const all = await reportsApi.pendingLedger({ ...params, page: 1, limit: 100000 });
      if (all.items.length === 0) return toast.error('Nothing to export');
      exportPendingLedgerReport(all.items, tab, meta, [
        { label: 'Type', value: tab === 'sales' ? 'Unpaid Sales' : 'Unpaid Purchases' },
        { label: 'Status', value: status },
        { label: 'From', value: from }, { label: 'To', value: to },
      ]);
      toast.success('Exported', `${all.items.length} rows.`);
    } catch (err) {
      toast.error('Export failed', err instanceof Error ? err.message : 'Try again.');
    }
  }

  const items = data?.items ?? [];
  const tabs: { id: Tab; label: string; icon: typeof ReceiptText }[] = [
    { id: 'sales', label: 'Unpaid Sales', icon: ReceiptText },
    { id: 'purchases', label: 'Unpaid Purchases', icon: ShoppingCart },
  ];

  return (
    <div>
      <PageHeader
        title="Pending Ledger"
        description="All unpaid and partially paid invoices — money still to collect or pay."
        icon={<AlertCircle className="h-5 w-5" />}
        actions={<Button variant="outline" onClick={handleExport}><Download className="h-4 w-4" />Export</Button>}
      />

      <div className="mb-6 inline-flex flex-wrap gap-1 rounded-lg border border-border bg-muted/40 p-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = t.id === tab;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn('inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors', active ? 'bg-background text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground')}>
              <Icon className="h-4 w-4" />{t.label}
            </button>
          );
        })}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Search bill no or party…" className="sm:max-w-xs" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-40">
          <option value="all">All unpaid</option>
          <option value="unpaid">Fully unpaid</option>
          <option value="partial">Partially paid</option>
        </Select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="sm:w-40" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="sm:w-40" />
      </div>

      {data && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 px-4 py-2 text-sm">
          <span className="text-muted-foreground">{tab === 'sales' ? 'Total to collect:' : 'Total to pay:'}</span>
          <span className="font-bold text-warning">{formatCurrency(data.totalRemaining, currency)}</span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={AlertCircle} title="Nothing pending" description={tab === 'sales' ? 'No unpaid sales for these filters.' : 'No unpaid purchases for these filters.'} />
      ) : (
        <div className="rounded-lg border border-border">
          <div className="overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>{tab === 'sales' ? 'Dealer / Customer' : 'Vendor'}</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.no}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(r.date)}</TableCell>
                    <TableCell>{r.party}</TableCell>
                    <TableCell className="text-right">{formatCurrency(r.total, currency)}</TableCell>
                    <TableCell className="text-right text-success">{formatCurrency(r.paid, currency)}</TableCell>
                    <TableCell className="text-right font-semibold text-warning">{formatCurrency(r.remaining, currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {data && data.total > 0 && (
        <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">{data.total} invoice{data.total !== 1 ? 's' : ''}</p>
          <Pagination page={data.page} pageCount={data.pageCount} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
