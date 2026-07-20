import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { History, Pencil, Plus, Trash2, Truck } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchBar } from '@/components/common/SearchBar';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { VendorFormDialog } from '@/components/vendors/VendorFormDialog';
import { vendorsApi } from '@/services/vendors.service';
import { settingsService } from '@/services/settings.service';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { toast } from '@/utils/toast';
import type { Vendor } from '@/types';

const PAGE_SIZE = 8;

function VendorHistoryDialog({ vendor, onClose, currency }: { vendor: Vendor | null; onClose: () => void; currency: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['vendor-history', vendor?.id],
    queryFn: () => vendorsApi.history(vendor!.id),
    enabled: !!vendor,
  });

  return (
    <Dialog open={!!vendor} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{vendor?.name}</DialogTitle>
          <DialogDescription>
            Outstanding balance: <span className="font-semibold text-foreground">{formatCurrency(vendor?.balance ?? 0, currency)}</span>
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : data && data.purchases.length > 0 ? (
          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Purchase No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.purchases.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.purchaseNo}</TableCell>
                    <TableCell>{formatDate(p.purchaseDate)}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === 'COMPLETED' ? 'success' : 'secondary'}>
                        {p.status === 'COMPLETED' ? 'Completed' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(p.totalAmount, currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState icon={History} title="No purchases yet" />
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function VendorsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [deleting, setDeleting] = useState<Vendor | null>(null);
  const [historyVendor, setHistoryVendor] = useState<Vendor | null>(null);

  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: settingsService.get, retry: false });
  const currency = settings?.currency ?? 'PKR';

  const { data, isLoading } = useQuery({ queryKey: ['vendors'], queryFn: () => vendorsApi.list() });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => vendorsApi.setStatus(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendors'] }),
    onError: (err: Error) => toast.error('Could not update status', err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vendorsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor deleted');
      setDeleting(null);
    },
    onError: (err: Error) => toast.error('Could not delete', err.message),
  });

  const filtered = useMemo(() => {
    const items = data ?? [];
    const q = search.trim().toLowerCase();
    return items.filter((v) => {
      const matchesSearch = !q || v.name.toLowerCase().includes(q) || (v.phone ?? '').toLowerCase().includes(q);
      const matchesStatus = status === 'all' || (status === 'active' ? v.isActive : !v.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [data, search, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <div>
      <PageHeader
        title="Vendors"
        description="Suppliers you buy spare parts from, with outstanding balances."
        icon={<Truck className="h-5 w-5" />}
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4" />
            Add Vendor
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search vendors…" className="sm:max-w-xs" />
        <Select value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setPage(1); }} className="sm:w-40">
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : pageItems.length === 0 ? (
        <EmptyState
          icon={Truck}
          title={search || status !== 'all' ? 'No matching vendors' : 'No vendors yet'}
          description={search || status !== 'all' ? 'Try a different search or filter.' : 'Add your first vendor to start recording purchases.'}
          action={!search && status === 'all' ? <Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" />Add Vendor</Button> : undefined}
        />
      ) : (
        <div className="rounded-lg border border-border">
          <div className="overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.name}</TableCell>
                    <TableCell className="text-muted-foreground">{v.phone || '—'}</TableCell>
                    <TableCell className="text-right font-semibold">
                      <span className={v.balance > 0 ? 'text-warning' : undefined}>
                        {formatCurrency(v.balance, currency)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={v.isActive} onCheckedChange={(c) => statusMutation.mutate({ id: v.id, isActive: c })} />
                        <Badge variant={v.isActive ? 'success' : 'secondary'}>{v.isActive ? 'Active' : 'Inactive'}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setHistoryVendor(v)} aria-label="History">
                          <History className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setEditing(v); setFormOpen(true); }} aria-label="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleting(v)} aria-label="Delete">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {pageCount > 1 && <Pagination page={current} pageCount={pageCount} onPageChange={setPage} className="mt-5" />}

      <VendorFormDialog open={formOpen} onOpenChange={setFormOpen} vendor={editing} />
      <VendorHistoryDialog vendor={historyVendor} onClose={() => setHistoryVendor(null)} currency={currency} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete vendor?"
        description={deleting ? `“${deleting.name}” will be removed. Vendors with purchases cannot be deleted.` : ''}
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
