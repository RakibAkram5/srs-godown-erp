import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Banknote, Download, Pencil, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchBar } from '@/components/common/SearchBar';
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
import { salariesApi, type SalaryPayload } from '@/services/salaries.service';
import { usersApi } from '@/services/users.service';
import { settingsService } from '@/services/settings.service';
import { exportSalariesReport } from '@/utils/reportExports';
import { formatCurrency } from '@/utils/formatters';
import { toast } from '@/utils/toast';
import type { PayMethod, Salary } from '@/types';

const PAGE_SIZE = 12;
const METHODS: PayMethod[] = ['CASH', 'BANK', 'CARD', 'CHEQUE', 'OTHER'];

function status(s: Salary): { label: string; variant: 'success' | 'warning' | 'secondary' } {
  if (s.paidAmount >= s.amount) return { label: 'Paid', variant: 'success' };
  if (s.paidAmount > 0) return { label: 'Partial', variant: 'warning' };
  return { label: 'Unpaid', variant: 'secondary' };
}

function SalaryFormDialog({ open, onOpenChange, editing }: { open: boolean; onOpenChange: (v: boolean) => void; editing: Salary | null }) {
  const queryClient = useQueryClient();
  const [employeeName, setEmployeeName] = useState('');
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [amount, setAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState('');
  const [method, setMethod] = useState<PayMethod>('CASH');
  const [notes, setNotes] = useState('');

  const { data: users } = useQuery({ queryKey: ['users'], queryFn: usersApi.list, enabled: open });

  useEffect(() => {
    if (open) {
      if (editing) {
        setEmployeeName(editing.employeeName); setMonth(editing.month); setAmount(editing.amount);
        setPaidAmount(editing.paidAmount); setPaymentDate(editing.paymentDate ? editing.paymentDate.slice(0, 10) : '');
        setMethod(editing.method); setNotes(editing.notes ?? '');
      } else {
        setEmployeeName(''); setMonth(new Date().toISOString().slice(0, 7)); setAmount(0);
        setPaidAmount(0); setPaymentDate(''); setMethod('CASH'); setNotes('');
      }
    }
  }, [open, editing]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload: SalaryPayload = { employeeName, month, amount, paidAmount, paymentDate: paymentDate || null, method, notes: notes || null };
      return editing ? salariesApi.update(editing.id, payload) : salariesApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
      toast.success(editing ? 'Salary updated' : 'Salary added');
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error('Could not save', err.message),
  });

  function submit() {
    if (!employeeName.trim()) return toast.error('Employee required');
    if (!/^\d{4}-\d{2}$/.test(month)) return toast.error('Month required');
    if (amount <= 0) return toast.error('Invalid amount', 'Amount must be greater than 0.');
    mutation.mutate();
  }

  const remaining = Math.max(0, amount - paidAmount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit salary' : 'Add salary'}</DialogTitle>
          <DialogDescription>Record a monthly salary and its payment.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="emp">Employee</Label>
              <Input id="emp" list="emp-list" placeholder="Employee name" value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} />
              <datalist id="emp-list">{(users ?? []).map((u) => <option key={u.id} value={u.name} />)}</datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="smonth">Month</Label>
              <Input id="smonth" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="samt">Salary amount</Label>
              <NumberField id="samt" value={amount} onValueChange={setAmount} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spaid">Paid amount</Label>
              <NumberField id="spaid" value={paidAmount} onValueChange={setPaidAmount} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spdate">Payment date</Label>
              <Input id="spdate" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smethod">Method</Label>
              <Select id="smethod" value={method} onChange={(e) => setMethod(e.target.value as PayMethod)}>
                {METHODS.map((m) => <option key={m} value={m}>{m.charAt(0) + m.slice(1).toLowerCase()}</option>)}
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
            <span className="text-muted-foreground">Remaining</span>
            <span className="font-semibold text-warning">{formatCurrency(remaining)}</span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="snotes">Notes</Label>
            <Textarea id="snotes" rows={2} placeholder="Optional" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button loading={mutation.isPending} onClick={submit}>{editing ? 'Save changes' : 'Add salary'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SalariesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [month, setMonth] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Salary | null>(null);
  const [deleting, setDeleting] = useState<Salary | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: settingsService.get, retry: false });
  const currency = settings?.currency ?? 'PKR';
  const meta = { companyName: settings?.companyName || 'SRS Traders', logoUrl: settings?.companyLogo, currency };

  const query = { search: debounced || undefined, month: month || undefined, page, limit: PAGE_SIZE };
  const { data, isLoading } = useQuery({ queryKey: ['salaries', query], queryFn: () => salariesApi.list(query) });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => salariesApi.remove(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['salaries'] }); toast.success('Salary deleted'); setDeleting(null); },
    onError: (err: Error) => toast.error('Could not delete', err.message),
  });

  async function handleExport() {
    try {
      const all = await salariesApi.list({ ...query, page: 1, limit: 100000 });
      if (all.items.length === 0) return toast.error('Nothing to export');
      await exportSalariesReport(all.items, meta, [{ label: 'Month', value: month }]);
      toast.success('Exported', `${all.items.length} salary records.`);
    } catch (err) {
      toast.error('Export failed', err instanceof Error ? err.message : 'Try again.');
    }
  }

  const items = data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Salary Management"
        description="Monthly employee salaries with payment history."
        icon={<Banknote className="h-5 w-5" />}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4" />Export</Button>
            <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" />Add Salary</Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Search employee…" className="sm:max-w-xs" />
        <Input type="month" value={month} onChange={(e) => { setMonth(e.target.value); setPage(1); }} className="sm:w-44" />
      </div>

      {data && (
        <div className="mb-4 flex flex-wrap gap-3 text-sm">
          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2">
            <span className="text-muted-foreground">Total salaries:</span><span className="font-bold">{formatCurrency(data.totalAmount, currency)}</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2">
            <span className="text-muted-foreground">Paid:</span><span className="font-bold text-success">{formatCurrency(data.totalPaid, currency)}</span>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={Banknote} title="No salary records" description="Add a monthly salary to get started." action={<Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" />Add Salary</Button>} />
      ) : (
        <div className="rounded-lg border border-border">
          <div className="overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((s) => {
                  const st = status(s);
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.salaryNo}</TableCell>
                      <TableCell>{s.employeeName}</TableCell>
                      <TableCell className="text-muted-foreground">{s.month}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(s.amount, currency)}</TableCell>
                      <TableCell className="text-right text-success">{formatCurrency(s.paidAmount, currency)}</TableCell>
                      <TableCell className="text-right text-warning">{formatCurrency(Math.max(0, s.amount - s.paidAmount), currency)}</TableCell>
                      <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setEditing(s); setFormOpen(true); }} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleting(s)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {data && data.total > 0 && (
        <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">{data.total} record{data.total !== 1 ? 's' : ''}</p>
          <Pagination page={data.page} pageCount={data.pageCount} onPageChange={setPage} />
        </div>
      )}

      <SalaryFormDialog open={formOpen} onOpenChange={setFormOpen} editing={editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete salary record?"
        description={deleting ? `${deleting.salaryNo} for ${deleting.employeeName} (${deleting.month}) will be removed.` : ''}
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
