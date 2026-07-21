import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftRight, Download, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { NumberField } from '@/components/ui/NumberField';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { paymentsApi } from '@/services/payments.service';
import { settingsService } from '@/services/settings.service';
import { exportPaymentsReport } from '@/utils/reportExports';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { toast } from '@/utils/toast';
import type { Payment, PayMethod } from '@/types';

const PAGE_SIZE = 12;
const METHODS: PayMethod[] = ['CASH', 'BANK', 'CARD', 'CHEQUE', 'OTHER'];

function EditPaymentDialog({ payment, onClose }: { payment: Payment | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<PayMethod>('CASH');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (payment) {
      setAmount(payment.amount); setMethod(payment.method);
      setDate(payment.paymentDate.slice(0, 10)); setNotes(payment.notes ?? '');
    }
  }, [payment]);

  const mutation = useMutation({
    mutationFn: () => paymentsApi.update(payment!.id, { amount, method, paymentDate: date, notes: notes || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['dealers'] });
      toast.success('Payment updated');
      onClose();
    },
    onError: (err: Error) => toast.error('Could not update', err.message),
  });

  return (
    <Dialog open={!!payment} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {payment?.type === 'VENDOR_PAYMENT' ? 'payment' : 'receipt'} — {payment?.voucherNo}</DialogTitle>
          <DialogDescription>Updating the amount adjusts the party's outstanding balance.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="pamt">Amount</Label><NumberField id="pamt" value={amount} onValueChange={setAmount} /></div>
            <div className="space-y-2">
              <Label htmlFor="pm">Method</Label>
              <Select id="pm" value={method} onChange={(e) => setMethod(e.target.value as PayMethod)}>
                {METHODS.map((m) => <option key={m} value={m}>{m.charAt(0) + m.slice(1).toLowerCase()}</option>)}
              </Select>
            </div>
            <div className="space-y-2"><Label htmlFor="pd">Date</Label><Input id="pd" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label htmlFor="pn">Notes</Label><Textarea id="pn" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button loading={mutation.isPending} disabled={amount <= 0} onClick={() => mutation.mutate()}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [type, setType] = useState('all');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [deleting, setDeleting] = useState<Payment | null>(null);

  useEffect(() => setPage(1), [type]);

  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: settingsService.get, retry: false });
  const currency = settings?.currency ?? 'PKR';
  const meta = { companyName: settings?.companyName || 'SRS Traders', logoUrl: settings?.companyLogo, currency };

  const query = { type: type === 'all' ? undefined : type, page, limit: PAGE_SIZE };
  const { data, isLoading } = useQuery({ queryKey: ['payments', query], queryFn: () => paymentsApi.list(query) });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => paymentsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['dealers'] });
      toast.success('Deleted — balance reversed'); setDeleting(null);
    },
    onError: (err: Error) => toast.error('Could not delete', err.message),
  });

  async function handleExport() {
    try {
      const all = await paymentsApi.list({ type: type === 'all' ? undefined : type, page: 1, limit: 100000 });
      if (all.items.length === 0) return toast.error('Nothing to export');
      exportPaymentsReport(all.items, meta, [{ label: 'Type', value: type === 'all' ? 'All' : type }]);
      toast.success('Exported', `${all.items.length} entries.`);
    } catch (err) {
      toast.error('Export failed', err instanceof Error ? err.message : 'Try again.');
    }
  }

  const items = data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Payments"
        description="All vendor payments and dealer receipts — edit or delete to keep balances correct."
        icon={<ArrowLeftRight className="h-5 w-5" />}
        actions={<Button variant="outline" onClick={handleExport}><Download className="h-4 w-4" />Export</Button>}
      />

      <div className="mb-4">
        <Select value={type} onChange={(e) => setType(e.target.value)} className="sm:w-56">
          <option value="all">All payments & receipts</option>
          <option value="VENDOR_PAYMENT">Vendor payments (paid)</option>
          <option value="DEALER_RECEIPT">Dealer receipts (received)</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={ArrowLeftRight} title="No payments yet" description="Record payments/receipts from the Ledgers page." />
      ) : (
        <div className="rounded-lg border border-border">
          <div className="overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Voucher</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.voucherNo}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(p.paymentDate)}</TableCell>
                    <TableCell><Badge variant={p.type === 'VENDOR_PAYMENT' ? 'warning' : 'success'}>{p.type === 'VENDOR_PAYMENT' ? 'Payment' : 'Receipt'}</Badge></TableCell>
                    <TableCell>{p.vendor?.name || p.dealer?.name || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{p.method}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(p.amount, currency)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setEditing(p)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleting(p)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
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
          <p className="text-sm text-muted-foreground">{data.total} entr{data.total !== 1 ? 'ies' : 'y'}</p>
          <Pagination page={data.page} pageCount={data.pageCount} onPageChange={setPage} />
        </div>
      )}

      <EditPaymentDialog payment={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete entry?"
        description={deleting ? `${deleting.voucherNo} will be removed and the party's balance reversed.` : ''}
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
