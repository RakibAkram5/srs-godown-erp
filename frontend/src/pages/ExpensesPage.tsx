import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Pencil, Plus, Trash2, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchBar } from '@/components/common/SearchBar';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
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
import { expensesApi, type ExpensePayload } from '@/services/expenses.service';
import { settingsService } from '@/services/settings.service';
import { exportExpensesReport } from '@/utils/reportExports';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { toast } from '@/utils/toast';
import type { Expense, PayMethod } from '@/types';

const PAGE_SIZE = 12;
const CATEGORIES = ['Rent', 'Electricity', 'Utility Bills', 'Maintenance', 'Equipment', 'Tape', 'Curtains', 'Transport', 'Repairs', 'Miscellaneous'];
const METHODS: PayMethod[] = ['CASH', 'BANK', 'CARD', 'CHEQUE', 'OTHER'];

function ExpenseFormDialog({ open, onOpenChange, editing }: { open: boolean; onOpenChange: (v: boolean) => void; editing: Expense | null }) {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState<PayMethod>('CASH');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      if (editing) {
        setCategory(editing.category); setAmount(editing.amount);
        setDate(editing.expenseDate.slice(0, 10)); setMethod(editing.method);
        setDescription(editing.description ?? ''); setNotes(editing.notes ?? '');
      } else {
        setCategory(''); setAmount(0); setDate(new Date().toISOString().slice(0, 10));
        setMethod('CASH'); setDescription(''); setNotes('');
      }
    }
  }, [open, editing]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload: ExpensePayload = { category, amount, expenseDate: date, method, description: description || null, notes: notes || null };
      return editing ? expensesApi.update(editing.id, payload) : expensesApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success(editing ? 'Expense updated' : 'Expense added');
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error('Could not save', err.message),
  });

  function submit() {
    if (!category.trim()) return toast.error('Category required');
    if (amount <= 0) return toast.error('Invalid amount', 'Amount must be greater than 0.');
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit expense' : 'Add expense'}</DialogTitle>
          <DialogDescription>Record a warehouse/godown expense.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ecat">Category</Label>
              <Input id="ecat" list="expense-cats" placeholder="e.g. Electricity" value={category} onChange={(e) => setCategory(e.target.value)} />
              <datalist id="expense-cats">{CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="eamt">Amount</Label>
              <NumberField id="eamt" value={amount} onValueChange={setAmount} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edate">Date</Label>
              <Input id="edate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emethod">Method</Label>
              <Select id="emethod" value={method} onChange={(e) => setMethod(e.target.value as PayMethod)}>
                {METHODS.map((m) => <option key={m} value={m}>{m.charAt(0) + m.slice(1).toLowerCase()}</option>)}
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edesc">Description</Label>
            <Input id="edesc" placeholder="Optional" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="enotes">Notes</Label>
            <Textarea id="enotes" rows={2} placeholder="Optional" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button loading={mutation.isPending} onClick={submit}>{editing ? 'Save changes' : 'Add expense'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [category, setCategory] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: settingsService.get, retry: false });
  const currency = settings?.currency ?? 'PKR';
  const meta = { companyName: settings?.companyName || 'SRS Traders', logoUrl: settings?.companyLogo, currency };

  const query = { search: debounced || undefined, category, from: from || undefined, to: to || undefined, page, limit: PAGE_SIZE };
  const { data, isLoading } = useQuery({ queryKey: ['expenses', query], queryFn: () => expensesApi.list(query) });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expensesApi.remove(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['expenses'] }); toast.success('Expense deleted'); setDeleting(null); },
    onError: (err: Error) => toast.error('Could not delete', err.message),
  });

  async function handleExport() {
    try {
      const all = await expensesApi.list({ ...query, page: 1, limit: 100000 });
      if (all.items.length === 0) return toast.error('Nothing to export');
      await exportExpensesReport(all.items, meta, [{ label: 'Category', value: category }, { label: 'From', value: from }, { label: 'To', value: to }]);
      toast.success('Exported', `${all.items.length} expenses.`);
    } catch (err) {
      toast.error('Export failed', err instanceof Error ? err.message : 'Try again.');
    }
  }

  const items = data?.items ?? [];
  const categories = useMemo(() => ['all', ...CATEGORIES], []);

  return (
    <div>
      <PageHeader
        title="Godown Expenses"
        description="Warehouse running costs — rent, utilities, maintenance, equipment and more."
        icon={<Wallet className="h-5 w-5" />}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4" />Export</Button>
            <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" />Add Expense</Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Search category or description…" className="sm:max-w-xs" />
        <Select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="sm:w-44">
          {categories.map((c) => <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>)}
        </Select>
        <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="sm:w-40" />
        <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="sm:w-40" />
      </div>

      {data && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm">
          <span className="text-muted-foreground">Total (filtered):</span>
          <span className="font-bold">{formatCurrency(data.totalAmount, currency)}</span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={Wallet} title="No expenses" description="Add your first warehouse expense." action={<Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" />Add Expense</Button>} />
      ) : (
        <div className="rounded-lg border border-border">
          <div className="overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.expenseNo}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(e.expenseDate)}</TableCell>
                    <TableCell>{e.category}</TableCell>
                    <TableCell className="max-w-[220px] text-muted-foreground">{e.description || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{e.method}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(e.amount, currency)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setEditing(e); setFormOpen(true); }} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleting(e)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
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
          <p className="text-sm text-muted-foreground">{data.total} expense{data.total !== 1 ? 's' : ''}</p>
          <Pagination page={data.page} pageCount={data.pageCount} onPageChange={setPage} />
        </div>
      )}

      <ExpenseFormDialog open={formOpen} onOpenChange={setFormOpen} editing={editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete expense?"
        description={deleting ? `${deleting.expenseNo} (${deleting.category}) will be removed.` : ''}
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
