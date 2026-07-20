import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowDownUp,
  ArrowUp,
  Download,
  Eye,
  History,
  MoreHorizontal,
  Pencil,
  Plus,
  ShoppingCart,
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
import { PurchaseFormDialog } from '@/components/purchases/PurchaseFormDialog';
import { PurchaseViewDialog } from '@/components/purchases/PurchaseViewDialog';
import { PurchaseReturnDialog } from '@/components/purchases/PurchaseReturnDialog';
import { purchasesApi, type PurchaseQuery } from '@/services/purchases.service';
import { vendorsApi } from '@/services/vendors.service';
import { settingsService } from '@/services/settings.service';
import { exportPurchasesExcel } from '@/utils/purchaseDocs';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatters';
import { toast } from '@/utils/toast';
import { cn } from '@/lib/utils';
import type { Purchase, StockMovementType } from '@/types';

const PAGE_SIZE = 10;
type Tab = 'purchases' | 'returns' | 'stock';
type SortKey = 'purchaseDate' | 'totalAmount' | 'createdAt';

const movementLabels: Record<StockMovementType, string> = {
  PURCHASE_IN: 'Purchase In',
  PURCHASE_RETURN_OUT: 'Return Out',
  SALE_OUT: 'Sale Out',
  SALE_RETURN_IN: 'Sale Return In',
  ADJUSTMENT: 'Adjustment',
};

export default function PurchasesPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('purchases');

  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: settingsService.get, retry: false });
  const currency = settings?.currency ?? 'PKR';
  const { data: vendors } = useQuery({ queryKey: ['vendors'], queryFn: () => vendorsApi.list() });

  /* Purchases tab state */
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [status, setStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Purchase | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [returning, setReturning] = useState<Purchase | null>(null);
  const [deleting, setDeleting] = useState<Purchase | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const query: PurchaseQuery = useMemo(() => ({
    search: debounced || undefined,
    vendorId: vendorId || undefined,
    status,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    sortBy, sortOrder, page, limit: PAGE_SIZE,
  }), [debounced, vendorId, status, dateFrom, dateTo, sortBy, sortOrder, page]);

  const purchasesQuery = useQuery({
    queryKey: ['purchases', query],
    queryFn: () => purchasesApi.list(query),
    enabled: tab === 'purchases',
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => purchasesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      toast.success('Purchase deleted');
      setDeleting(null);
    },
    onError: (err: Error) => toast.error('Could not delete', err.message),
  });

  /* Returns tab */
  const [returnPage, setReturnPage] = useState(1);
  const returnsQuery = useQuery({
    queryKey: ['purchase-returns', returnPage],
    queryFn: () => purchasesApi.listReturns({ page: returnPage, limit: PAGE_SIZE }),
    enabled: tab === 'returns',
  });

  /* Stock history tab */
  const [moveType, setMoveType] = useState('');
  const [movePage, setMovePage] = useState(1);
  const movementsQuery = useQuery({
    queryKey: ['stock-movements', moveType, movePage],
    queryFn: () => purchasesApi.stockMovements({ type: moveType || undefined, page: movePage, limit: 15 }),
    enabled: tab === 'stock',
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
      const all = await purchasesApi.list({ ...query, page: 1, limit: 100000 });
      if (all.items.length === 0) return toast.error('Nothing to export');
      exportPurchasesExcel(all.items);
      toast.success('Exported', `${all.items.length} purchases exported.`);
    } catch (err) {
      toast.error('Export failed', err instanceof Error ? err.message : 'Try again.');
    }
  }

  const tabs: { id: Tab; label: string; icon: typeof ShoppingCart }[] = [
    { id: 'purchases', label: 'Purchases', icon: ShoppingCart },
    { id: 'returns', label: 'Returns', icon: Undo2 },
    { id: 'stock', label: 'Stock History', icon: History },
  ];

  const purchases = purchasesQuery.data;

  return (
    <div>
      <PageHeader
        title="Purchases"
        description="Record purchases from vendors and keep stock updated automatically."
        icon={<ShoppingCart className="h-5 w-5" />}
        actions={
          tab === 'purchases' ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4" />Export</Button>
              <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" />New Purchase</Button>
            </div>
          ) : undefined
        }
      />

      {/* Tabs */}
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

      {/* ── Purchases tab ── */}
      {tab === 'purchases' && (
        <>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
            <SearchBar value={search} onChange={setSearch} placeholder="Search purchase no…" className="lg:max-w-xs" />
            <Select value={vendorId} onChange={(e) => { setVendorId(e.target.value); setPage(1); }} className="lg:w-48">
              <option value="">All vendors</option>
              {(vendors ?? []).map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </Select>
            <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="lg:w-40">
              <option value="all">All status</option>
              <option value="DRAFT">Draft</option>
              <option value="COMPLETED">Completed</option>
            </Select>
            <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="lg:w-40" />
            <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="lg:w-40" />
          </div>

          {purchasesQuery.isLoading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : !purchases || purchases.items.length === 0 ? (
            <EmptyState icon={ShoppingCart} title="No purchases found" description="Create your first purchase to add stock." action={<Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" />New Purchase</Button>} />
          ) : (
            <div className="rounded-lg border border-border">
              <div className="overflow-x-auto scrollbar-thin">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Purchase No</TableHead>
                      <TableHead><button className="inline-flex items-center gap-1" onClick={() => toggleSort('purchaseDate')}>Date <SortIcon column="purchaseDate" /></button></TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead className="text-center">Items</TableHead>
                      <TableHead className="text-right"><button className="inline-flex items-center gap-1" onClick={() => toggleSort('totalAmount')}>Total <SortIcon column="totalAmount" /></button></TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.items.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell><button className="font-medium hover:text-primary" onClick={() => setViewingId(p.id)}>{p.purchaseNo}</button></TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(p.purchaseDate)}</TableCell>
                        <TableCell className="text-muted-foreground">{p.vendor?.name ?? '—'}</TableCell>
                        <TableCell className="text-center">{p._count?.items ?? 0}</TableCell>
                        <TableCell className="whitespace-nowrap text-right font-medium">{formatCurrency(p.totalAmount, currency)}</TableCell>
                        <TableCell><Badge variant={p.status === 'COMPLETED' ? 'success' : 'secondary'}>{p.status === 'COMPLETED' ? 'Completed' : 'Draft'}</Badge></TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Actions"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => setViewingId(p.id)}><Eye />View</DropdownMenuItem>
                              {p.status === 'DRAFT' && (
                                <DropdownMenuItem onClick={async () => { const full = await purchasesApi.get(p.id); setEditing(full); setFormOpen(true); }}><Pencil />Edit</DropdownMenuItem>
                              )}
                              {p.status === 'COMPLETED' && (
                                <DropdownMenuItem onClick={async () => { const full = await purchasesApi.get(p.id); setReturning(full); }}><Undo2 />Return</DropdownMenuItem>
                              )}
                              {p.status === 'DRAFT' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => setDeleting(p)} className="text-destructive focus:bg-destructive/10 focus:text-destructive"><Trash2 />Delete</DropdownMenuItem>
                                </>
                              )}
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

          {purchases && purchases.total > 0 && (
            <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-sm text-muted-foreground">{purchases.total} purchase{purchases.total !== 1 ? 's' : ''}</p>
              <Pagination page={purchases.page} pageCount={purchases.pageCount} onPageChange={setPage} />
            </div>
          )}
        </>
      )}

      {/* ── Returns tab ── */}
      {tab === 'returns' && (
        returnsQuery.isLoading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : !returnsQuery.data || returnsQuery.data.items.length === 0 ? (
          <EmptyState icon={Undo2} title="No returns yet" description="Returns you record against completed purchases appear here." />
        ) : (
          <>
            <div className="rounded-lg border border-border">
              <div className="overflow-x-auto scrollbar-thin">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Return No</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Purchase</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead className="text-center">Items</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returnsQuery.data.items.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.returnNo}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(r.returnDate)}</TableCell>
                        <TableCell className="text-muted-foreground">{r.purchase?.purchaseNo ?? '—'}</TableCell>
                        <TableCell className="text-muted-foreground">{r.vendor?.name ?? '—'}</TableCell>
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

      {/* ── Stock history tab ── */}
      {tab === 'stock' && (
        <>
          <div className="mb-4">
            <Select value={moveType} onChange={(e) => { setMoveType(e.target.value); setMovePage(1); }} className="sm:w-56">
              <option value="">All movements</option>
              <option value="PURCHASE_IN">Purchase In</option>
              <option value="PURCHASE_RETURN_OUT">Return Out</option>
              <option value="SALE_OUT">Sale Out</option>
              <option value="SALE_RETURN_IN">Sale Return In</option>
              <option value="ADJUSTMENT">Adjustment</option>
            </Select>
          </div>
          {movementsQuery.isLoading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : !movementsQuery.data || movementsQuery.data.items.length === 0 ? (
            <EmptyState icon={History} title="No stock movements yet" description="Stock changes from purchases and returns are logged here." />
          ) : (
            <>
              <div className="rounded-lg border border-border">
                <div className="overflow-x-auto scrollbar-thin">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-center">Change</TableHead>
                        <TableHead className="text-center">Balance</TableHead>
                        <TableHead>Reference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movementsQuery.data.items.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(m.createdAt)}</TableCell>
                          <TableCell className="font-medium">{m.productName}</TableCell>
                          <TableCell><Badge variant={m.quantity >= 0 ? 'success' : 'warning'}>{movementLabels[m.type]}</Badge></TableCell>
                          <TableCell className={cn('text-center font-semibold', m.quantity >= 0 ? 'text-success' : 'text-warning')}>
                            {m.quantity >= 0 ? `+${m.quantity}` : m.quantity}
                          </TableCell>
                          <TableCell className="text-center">{m.balanceAfter}</TableCell>
                          <TableCell className="text-muted-foreground">{m.referenceNo ?? '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <Pagination page={movementsQuery.data.page} pageCount={movementsQuery.data.pageCount} onPageChange={setMovePage} className="mt-4" />
            </>
          )}
        </>
      )}

      {/* Dialogs */}
      <PurchaseFormDialog open={formOpen} onOpenChange={setFormOpen} purchase={editing} />
      <PurchaseViewDialog
        purchaseId={viewingId}
        open={!!viewingId}
        onOpenChange={(v) => !v && setViewingId(null)}
        onEdit={(p) => { setEditing(p); setFormOpen(true); }}
        onReturn={(p) => setReturning(p)}
      />
      <PurchaseReturnDialog purchase={returning} open={!!returning} onOpenChange={(v) => !v && setReturning(null)} currency={currency} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete purchase?"
        description={deleting ? `Draft purchase ${deleting.purchaseNo} will be removed.` : ''}
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
