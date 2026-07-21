import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowDownUp,
  ArrowUp,
  Download,
  Eye,
  Clock,
  MoreHorizontal,
  PackageCheck,
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
  Undo2,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchBar } from '@/components/common/SearchBar';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SaleFormDialog } from '@/components/sales/SaleFormDialog';
import { SaleViewDialog } from '@/components/sales/SaleViewDialog';
import { SaleReturnDialog } from '@/components/sales/SaleReturnDialog';
import { salesApi, type SaleQuery } from '@/services/sales.service';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/lib/navigation';
import { settingsService } from '@/services/settings.service';
import { exportSalesExcel } from '@/utils/saleDocs';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { toast } from '@/utils/toast';
import { cn } from '@/lib/utils';
import type { Sale } from '@/types';

const PAGE_SIZE = 10;
type Tab = 'sales' | 'returns' | 'pending';
type SortKey = 'saleDate' | 'totalAmount' | 'createdAt';

export default function SalesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const admin = isAdmin(user);
  const [tab, setTab] = useState<Tab>('sales');

  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: settingsService.get, retry: false });
  const currency = settings?.currency ?? 'PKR';

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Sale | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [returning, setReturning] = useState<Sale | null>(null);
  const [deleting, setDeleting] = useState<Sale | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const query: SaleQuery = useMemo(() => ({
    search: debounced || undefined,
    status,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    sortBy, sortOrder, page, limit: PAGE_SIZE,
  }), [debounced, status, dateFrom, dateTo, sortBy, sortOrder, page]);

  const salesQuery = useQuery({
    queryKey: ['sales', query],
    queryFn: () => salesApi.list(query),
    enabled: tab === 'sales',
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => salesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Sale deleted');
      setDeleting(null);
    },
    onError: (err: Error) => toast.error('Could not delete', err.message),
  });

  const [returnPage, setReturnPage] = useState(1);
  const returnsQuery = useQuery({
    queryKey: ['sale-returns', returnPage],
    queryFn: () => salesApi.listReturns({ page: returnPage, limit: PAGE_SIZE }),
    enabled: tab === 'returns',
  });

  const pendingQuery = useQuery({
    queryKey: ['sale-pending'],
    queryFn: () => salesApi.listPending(),
    enabled: tab === 'pending',
  });
  const fulfillMutation = useMutation({
    mutationFn: (itemId: string) => salesApi.fulfillItem(itemId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['sale-pending'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      toast.success('Fulfilled', `${res.fulfilled} dispatched${res.remaining > 0 ? `, ${res.remaining} still pending` : ''}.`);
    },
    onError: (err: Error) => toast.error('Could not fulfill', err.message),
  });

  function toggleSort(key: SortKey) {
    if (sortBy === key) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(key); setSortOrder('desc'); }
    setPage(1);
  }
  function SortIcon({ column }: { column: SortKey }) {
    if (sortBy !== column) return <ArrowDownUp className="h-3.5 w-3.5 text-muted-foreground/60" />;
    return sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />;
  }

  async function handleExport() {
    try {
      const all = await salesApi.list({ ...query, page: 1, limit: 100000 });
      if (all.items.length === 0) return toast.error('Nothing to export');
      exportSalesExcel(all.items);
      toast.success('Exported', `${all.items.length} sales exported.`);
    } catch (err) {
      toast.error('Export failed', err instanceof Error ? err.message : 'Try again.');
    }
  }

  const tabs: { id: Tab; label: string; icon: typeof ReceiptText }[] = [
    { id: 'sales', label: 'Sales', icon: ReceiptText },
    { id: 'returns', label: 'Returns', icon: Undo2 },
    ...(admin ? [{ id: 'pending' as Tab, label: 'Pending', icon: Clock }] : []),
  ];
  const sales = salesQuery.data;

  return (
    <div>
      <PageHeader
        title="Sales"
        description="Sell spare parts and reduce stock automatically."
        icon={<ReceiptText className="h-5 w-5" />}
        actions={
          tab === 'sales' ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4" />Export</Button>
              <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" />New Sale</Button>
            </div>
          ) : undefined
        }
      />

      <div className="mb-6 inline-flex flex-wrap gap-1 rounded-lg border border-border bg-muted/40 p-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = t.id === tab;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn('inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors', active ? 'bg-background text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground')}>
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Sales tab ── */}
      {tab === 'sales' && (
        <>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
            <SearchBar value={search} onChange={setSearch} placeholder="Search sale no or customer…" className="lg:max-w-xs" />
            <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="lg:w-40">
              <option value="all">All status</option>
              <option value="DRAFT">Draft</option>
              <option value="COMPLETED">Completed</option>
            </Select>
            <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="lg:w-40" />
            <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="lg:w-40" />
          </div>

          {salesQuery.isLoading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : !sales || sales.items.length === 0 ? (
            <EmptyState icon={ReceiptText} title="No sales found" description="Create your first sale to reduce stock." action={<Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" />New Sale</Button>} />
          ) : (
            <div className="rounded-lg border border-border">
              <div className="overflow-x-auto scrollbar-thin">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sale No</TableHead>
                      <TableHead><button className="inline-flex items-center gap-1" onClick={() => toggleSort('saleDate')}>Date <SortIcon column="saleDate" /></button></TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right"><button className="inline-flex items-center gap-1" onClick={() => toggleSort('totalAmount')}>Total <SortIcon column="totalAmount" /></button></TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.items.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell><button className="font-medium hover:text-primary" onClick={() => setViewingId(s.id)}>{s.saleNo}</button></TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(s.saleDate)}</TableCell>
                        <TableCell className="text-muted-foreground">{s.customerName || 'Walk-in'}</TableCell>
                        <TableCell className="text-center">{s.totalQuantity ?? s._count?.items ?? 0}</TableCell>
                        <TableCell className="whitespace-nowrap text-right font-medium">{formatCurrency(s.totalAmount, currency)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={s.status === 'COMPLETED' ? 'success' : 'secondary'}>{s.status === 'COMPLETED' ? 'Completed' : 'Draft'}</Badge>
                            {s.status === 'COMPLETED' && (s.remaining ?? 0) > 0 ? (
                              <span className="text-[11px] font-medium text-warning">Due {formatCurrency(s.remaining ?? 0, currency)}</span>
                            ) : s.status === 'COMPLETED' ? (
                              <span className="text-[11px] font-medium text-success">Paid</span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Actions"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => setViewingId(s.id)}><Eye />View</DropdownMenuItem>
                              {s.status === 'DRAFT' && (
                                <DropdownMenuItem onClick={async () => { const full = await salesApi.get(s.id); setEditing(full); setFormOpen(true); }}><Pencil />Edit</DropdownMenuItem>
                              )}
                              {s.status === 'COMPLETED' && (
                                <DropdownMenuItem onClick={async () => { const full = await salesApi.get(s.id); setReturning(full); }}><Undo2 />Return</DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDeleting(s)} className="text-destructive focus:bg-destructive/10 focus:text-destructive"><Trash2 />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {sales && sales.total > 0 && (
            <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-sm text-muted-foreground">{sales.total} sale{sales.total !== 1 ? 's' : ''}</p>
              <Pagination page={sales.page} pageCount={sales.pageCount} onPageChange={setPage} />
            </div>
          )}
        </>
      )}

      {/* ── Returns tab ── */}
      {tab === 'returns' && (
        returnsQuery.isLoading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : !returnsQuery.data || returnsQuery.data.items.length === 0 ? (
          <EmptyState icon={Undo2} title="No returns yet" description="Returns you record against completed sales appear here." />
        ) : (
          <>
            <div className="rounded-lg border border-border">
              <div className="overflow-x-auto scrollbar-thin">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Return No</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Sale</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returnsQuery.data.items.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.returnNo}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(r.returnDate)}</TableCell>
                        <TableCell className="text-muted-foreground">{r.sale?.saleNo ?? '—'}</TableCell>
                        <TableCell className="text-muted-foreground">{r.sale?.customerName || 'Walk-in'}</TableCell>
                        <TableCell className="text-center">{r._count?.items ?? 0}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(r.totalAmount, currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            <Pagination page={returnsQuery.data.page} pageCount={returnsQuery.data.pageCount} onPageChange={setReturnPage} className="mt-4" />
          </>
        )
      )}

      {/* ── Pending tab ── */}
      {tab === 'pending' && (
        pendingQuery.isLoading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : !pendingQuery.data || pendingQuery.data.length === 0 ? (
          <EmptyState icon={PackageCheck} title="Nothing pending" description="Items that couldn't be fully delivered (out of stock) show up here." />
        ) : (
          <div className="rounded-lg border border-border">
            <div className="overflow-x-auto scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sale No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">Pending</TableHead>
                    <TableHead className="text-center">In stock</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingQuery.data.map((it) => {
                    const canFulfill = it.availableStock > 0;
                    return (
                      <TableRow key={it.id}>
                        <TableCell className="font-medium">{it.saleNo}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(it.saleDate)}</TableCell>
                        <TableCell className="text-muted-foreground">{it.customer}</TableCell>
                        <TableCell>{it.productName}</TableCell>
                        <TableCell className="text-center font-semibold text-warning">{it.pendingQuantity}</TableCell>
                        <TableCell className="text-center">
                          <span className={canFulfill ? 'text-success' : 'text-muted-foreground'}>{it.availableStock}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant={canFulfill ? 'default' : 'outline'}
                            disabled={!canFulfill || fulfillMutation.isPending}
                            onClick={() => fulfillMutation.mutate(it.id)}
                          >
                            <PackageCheck className="h-4 w-4" />
                            {canFulfill ? `Fulfill ${Math.min(it.pendingQuantity, it.availableStock)}` : 'No stock'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )
      )}

      {/* Dialogs */}
      <SaleFormDialog open={formOpen} onOpenChange={setFormOpen} sale={editing} />
      <SaleViewDialog
        saleId={viewingId}
        open={!!viewingId}
        onOpenChange={(v) => !v && setViewingId(null)}
        onEdit={(s) => { setEditing(s); setFormOpen(true); }}
        onReturn={(s) => setReturning(s)}
      />
      <SaleReturnDialog sale={returning} open={!!returning} onOpenChange={(v) => !v && setReturning(null)} currency={currency} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete sale?"
        description={deleting ? (deleting.status === 'COMPLETED'
          ? `Sale ${deleting.saleNo} will be deleted. Delivered stock will be restored and the dealer's balance reversed. (Not allowed if it has returns or dispatches.)`
          : `Draft sale ${deleting.saleNo} will be removed.`) : ''}
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
