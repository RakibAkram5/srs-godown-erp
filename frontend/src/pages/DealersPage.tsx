import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Pencil, Plus, Store, Trash2 } from 'lucide-react';
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
import { DealerFormDialog } from '@/components/dealers/DealerFormDialog';
import { dealersApi } from '@/services/dealers.service';
import { settingsService } from '@/services/settings.service';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { toast } from '@/utils/toast';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/lib/navigation';
import type { Dealer } from '@/types';

const PAGE_SIZE = 8;

function DealerLedgerDialog({ dealer, onClose, currency }: { dealer: Dealer | null; onClose: () => void; currency: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['dealer-ledger', dealer?.id],
    queryFn: () => dealersApi.ledger(dealer!.id),
    enabled: !!dealer,
  });

  return (
    <Dialog open={!!dealer} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dealer?.name} — Ledger</DialogTitle>
          <DialogDescription>
            Outstanding balance: <span className="font-semibold text-foreground">{formatCurrency(dealer?.balance ?? 0, currency)}</span>
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : data ? (
          <div className="max-h-96 overflow-y-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">Opening balance</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(data.openingBalance, currency)}</TableCell>
                </TableRow>
                {data.entries.map((e, i) => (
                  <TableRow key={i}>
                    <TableCell className="whitespace-nowrap">{formatDate(e.date)}</TableCell>
                    <TableCell>
                      <Badge variant={e.type === 'SALE' ? 'info' : 'warning'}>{e.type === 'SALE' ? 'Sale' : 'Return'}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{e.reference ?? '—'}</TableCell>
                    <TableCell className={`text-right ${e.amount >= 0 ? 'text-foreground' : 'text-success'}`}>
                      {e.amount >= 0 ? '+' : ''}{formatCurrency(e.amount, currency)}
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(e.balance, currency)}</TableCell>
                  </TableRow>
                ))}
                {data.entries.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="py-6 text-center text-muted-foreground">No sales yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export default function DealersPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const admin = isAdmin(user);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Dealer | null>(null);
  const [deleting, setDeleting] = useState<Dealer | null>(null);
  const [ledgerDealer, setLedgerDealer] = useState<Dealer | null>(null);

  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: settingsService.get, retry: false });
  const currency = settings?.currency ?? 'PKR';
  const { data, isLoading } = useQuery({ queryKey: ['dealers'], queryFn: () => dealersApi.list() });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => dealersApi.setStatus(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dealers'] }),
    onError: (err: Error) => toast.error('Could not update status', err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dealersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealers'] });
      toast.success('Dealer deleted');
      setDeleting(null);
    },
    onError: (err: Error) => toast.error('Could not delete', err.message),
  });

  const filtered = useMemo(() => {
    const items = data ?? [];
    const q = search.trim().toLowerCase();
    return items.filter((d) => {
      const matchesSearch = !q || d.name.toLowerCase().includes(q) || (d.phone ?? '').toLowerCase().includes(q) || (d.city ?? '').toLowerCase().includes(q);
      const matchesStatus = status === 'all' || (status === 'active' ? d.isActive : !d.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [data, search, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <div>
      <PageHeader
        title="Dealers"
        description="Customers you sell to, with running ledger balances."
        icon={<Store className="h-5 w-5" />}
        actions={<Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" />Add Dealer</Button>}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search name, phone or city…" className="sm:max-w-xs" />
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
          icon={Store}
          title={search || status !== 'all' ? 'No matching dealers' : 'No dealers yet'}
          description={search || status !== 'all' ? 'Try a different search or filter.' : 'Add your first dealer to start recording sales on account.'}
          action={!search && status === 'all' ? <Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" />Add Dealer</Button> : undefined}
        />
      ) : (
        <div className="rounded-lg border border-border">
          <div className="overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dealer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>City</TableHead>
                  {admin && <TableHead className="text-right">Outstanding</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="text-muted-foreground">{d.phone || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{d.city || '—'}</TableCell>
                    {admin && (
                      <TableCell className="text-right font-semibold">
                        <span className={d.balance > 0 ? 'text-warning' : undefined}>{formatCurrency(d.balance, currency)}</span>
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={d.isActive} onCheckedChange={(c) => statusMutation.mutate({ id: d.id, isActive: c })} />
                        <Badge variant={d.isActive ? 'success' : 'secondary'}>{d.isActive ? 'Active' : 'Inactive'}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {admin && (
                          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setLedgerDealer(d)} aria-label="Ledger">
                            <BookOpen className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setEditing(d); setFormOpen(true); }} aria-label="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleting(d)} aria-label="Delete">
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

      <DealerFormDialog open={formOpen} onOpenChange={setFormOpen} dealer={editing} />
      <DealerLedgerDialog dealer={ledgerDealer} onClose={() => setLedgerDealer(null)} currency={currency} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete dealer?"
        description={deleting ? `“${deleting.name}” will be removed. Dealers with sales cannot be deleted.` : ''}
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
