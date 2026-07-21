import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Pencil, Plus, Send, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchBar } from '@/components/common/SearchBar';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DispatchFormDialog } from '@/components/dispatch/DispatchFormDialog';
import { dispatchesApi } from '@/services/dispatches.service';
import { exportDispatchesExcel } from '@/utils/dispatchDocs';
import { formatDate } from '@/utils/formatters';
import { toast } from '@/utils/toast';
import type { Dispatch } from '@/types';

const PAGE_SIZE = 10;

export default function DispatchPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Dispatch | null>(null);
  const [deleting, setDeleting] = useState<Dispatch | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['dispatches', debounced, page],
    queryFn: () => dispatchesApi.list({ search: debounced || undefined, page, limit: PAGE_SIZE }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dispatchesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatches'] });
      toast.success('Dispatch deleted');
      setDeleting(null);
    },
    onError: (err: Error) => toast.error('Could not delete', err.message),
  });

  async function handleExport() {
    try {
      const all = await dispatchesApi.list({ search: debounced || undefined, page: 1, limit: 100000 });
      if (all.items.length === 0) return toast.error('Nothing to export');
      exportDispatchesExcel(all.items);
      toast.success('Exported', `${all.items.length} dispatches exported.`);
    } catch (err) {
      toast.error('Export failed', err instanceof Error ? err.message : 'Try again.');
    }
  }

  const items = data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Dispatch"
        description="Transport records — bilty, transporter and destination for each sale invoice."
        icon={<Send className="h-5 w-5" />}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4" />Export</Button>
            <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" />New Dispatch</Button>
          </div>
        }
      />

      <div className="mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search bilty, transporter, city…" className="sm:max-w-sm" />
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Send}
          title="No dispatches yet"
          description="Record a dispatch to keep a transport log for your sale invoices."
          action={<Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" />New Dispatch</Button>}
        />
      ) : (
        <div className="rounded-lg border border-border">
          <div className="overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dispatch No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Bilty</TableHead>
                  <TableHead>Transporter</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.dispatchNo}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(d.dispatchDate)}</TableCell>
                    <TableCell className="text-muted-foreground">{d.sale?.saleNo ?? '—'}</TableCell>
                    <TableCell>{d.biltyNumber}</TableCell>
                    <TableCell className="text-muted-foreground">{d.transporterName}</TableCell>
                    <TableCell>{d.city}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
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

      {data && data.total > 0 && (
        <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">{data.total} dispatch{data.total !== 1 ? 'es' : ''}</p>
          <Pagination page={data.page} pageCount={data.pageCount} onPageChange={setPage} />
        </div>
      )}

      <DispatchFormDialog open={formOpen} onOpenChange={setFormOpen} editing={editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete dispatch?"
        description={deleting ? `Dispatch ${deleting.dispatchNo} will be removed from the record.` : ''}
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
