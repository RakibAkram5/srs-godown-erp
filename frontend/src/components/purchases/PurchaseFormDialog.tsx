import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { NumberField } from '@/components/ui/NumberField';
import { vendorsApi } from '@/services/vendors.service';
import { productsApi } from '@/services/products.service';
import { purchasesApi, type PurchasePayload } from '@/services/purchases.service';
import { settingsService } from '@/services/settings.service';
import { formatCurrency } from '@/utils/formatters';
import { toast } from '@/utils/toast';
import type { Purchase } from '@/types';

interface Row {
  productId: string;
  productName: string;
  quantity: number;
  purchasePrice: number;
  discount: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchase?: Purchase | null;
}

const emptyRow: Row = { productId: '', productName: '', quantity: 1, purchasePrice: 0, discount: 0 };

export function PurchaseFormDialog({ open, onOpenChange, purchase }: Props) {
  const queryClient = useQueryClient();
  const editing = !!purchase;

  const [vendorId, setVendorId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [warehouse, setWarehouse] = useState('');
  const [rack, setRack] = useState('');
  const [shelf, setShelf] = useState('');
  const [rows, setRows] = useState<Row[]>([{ ...emptyRow }]);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [paidAmount, setPaidAmount] = useState(0);

  const { data: vendors } = useQuery({ queryKey: ['vendors'], queryFn: () => vendorsApi.list(undefined, 'active') });
  const selectedVendor = (vendors ?? []).find((v) => v.id === vendorId);
  const { data: productData } = useQuery({
    queryKey: ['products-picker'],
    queryFn: () => productsApi.list({ status: 'active', limit: 100000, sortBy: 'name', sortOrder: 'asc' }),
  });
  const products = productData?.items ?? [];
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: settingsService.get, retry: false });
  const currency = settings?.currency ?? 'PKR';

  useEffect(() => {
    if (!open) return;
    if (purchase) {
      setVendorId(purchase.vendorId);
      setPurchaseDate(purchase.purchaseDate.slice(0, 10));
      setWarehouse(purchase.warehouse ?? '');
      setRack(purchase.rack ?? '');
      setShelf(purchase.shelf ?? '');
      setRows(
        (purchase.items ?? []).map((it) => ({
          productId: it.productId,
          productName: it.productName,
          quantity: it.quantity,
          purchasePrice: it.purchasePrice,
          discount: it.discount,
        })) || [{ ...emptyRow }],
      );
      setDiscount(purchase.discount);
      setNotes(purchase.notes ?? '');
      setPaidAmount(purchase.paidAmount ?? 0);
    } else {
      setVendorId('');
      setPurchaseDate(new Date().toISOString().slice(0, 10));
      setWarehouse(''); setRack(''); setShelf('');
      setRows([{ ...emptyRow }]);
      setDiscount(0); setNotes(''); setPaidAmount(0);
    }
  }, [open, purchase]);

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }
  function onPickProduct(index: number, productId: string) {
    const product = products.find((p) => p.id === productId);
    updateRow(index, {
      productId,
      productName: product?.name ?? '',
      purchasePrice: product?.purchasePrice ?? 0,
    });
  }
  function addRow() {
    setRows((prev) => [...prev, { ...emptyRow }]);
  }
  function removeRow(index: number) {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  const totals = useMemo(() => {
    const validRows = rows.filter((r) => r.productId && r.quantity > 0);
    const lineTotals = validRows.map((r) => Math.max(0, r.quantity * r.purchasePrice - r.discount));
    const subTotal = lineTotals.reduce((s, x) => s + x, 0);
    const total = Math.max(0, subTotal - discount);
    return { subTotal, total };
  }, [rows, discount]);

  const previousBalance = selectedVendor?.balance ?? 0;
  const grandTotalDue = previousBalance + totals.total;
  const balanceDue = Math.max(0, grandTotalDue - paidAmount);

  const mutation = useMutation({
    mutationFn: ({ status }: { status: 'DRAFT' | 'COMPLETED' }) => {
      const items = rows
        .filter((r) => r.productId && r.quantity > 0)
        .map((r) => ({
          productId: r.productId,
          productName: r.productName,
          quantity: r.quantity,
          purchasePrice: r.purchasePrice,
          discount: r.discount,
        }));
      const payload: PurchasePayload = {
        vendorId,
        purchaseDate,
        warehouse: warehouse || null,
        rack: rack || null,
        shelf: shelf || null,
        discount,
        paidAmount,
        notes: notes || null,
        status,
        items,
      };
      return editing ? purchasesApi.update(purchase!.id, payload) : purchasesApi.create(payload);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success(variables.status === 'COMPLETED' ? 'Purchase completed — stock updated' : 'Purchase saved as draft');
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error('Could not save purchase', err.message),
  });

  function submit(status: 'DRAFT' | 'COMPLETED') {
    if (!vendorId) return toast.error('Vendor required', 'Please choose a vendor.');
    const validRows = rows.filter((r) => r.productId && r.quantity > 0);
    if (validRows.length === 0) return toast.error('No items', 'Add at least one product with quantity.');
    mutation.mutate({ status });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit Purchase ${purchase?.purchaseNo ?? ''}` : 'New Purchase'}</DialogTitle>
          <DialogDescription>Add products, then save as draft or complete to update stock.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Header fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor</Label>
              <Select id="vendor" value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
                <option value="">— Select vendor —</option>
                {(vendors ?? []).map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Purchase date</Label>
              <Input id="date" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wh">Warehouse</Label>
              <Input id="wh" placeholder="Optional" value={warehouse} onChange={(e) => setWarehouse(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rk">Rack</Label>
              <Input id="rk" placeholder="Optional" value={rack} onChange={(e) => setRack(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sh">Shelf</Label>
              <Input id="sh" placeholder="Optional" value={shelf} onChange={(e) => setShelf(e.target.value)} />
            </div>
          </div>

          {/* Line items */}
          <div>
            <Label className="mb-2 block">Products</Label>
            <div className="space-y-2">
              {rows.map((row, i) => {
                const lineTotal = Math.max(0, row.quantity * row.purchasePrice - row.discount);
                return (
                  <div key={i} className="grid grid-cols-12 items-end gap-2 rounded-md border border-border p-2">
                    <div className="col-span-12 sm:col-span-4">
                      <Label className="text-xs text-muted-foreground">Product</Label>
                      <Select value={row.productId} onChange={(e) => onPickProduct(i, e.target.value)}>
                        <option value="">— Select —</option>
                        {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </Select>
                    </div>
                    <div className="col-span-3 sm:col-span-2">
                      <Label className="text-xs text-muted-foreground">Qty</Label>
                      <NumberField value={row.quantity} onValueChange={(n) => updateRow(i, { quantity: n })} allowDecimal={false} />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <Label className="text-xs text-muted-foreground">Price</Label>
                      <NumberField value={row.purchasePrice} onValueChange={(n) => updateRow(i, { purchasePrice: n })} />
                    </div>
                    <div className="col-span-3 sm:col-span-2">
                      <Label className="text-xs text-muted-foreground">Discount</Label>
                      <NumberField value={row.discount} onValueChange={(n) => updateRow(i, { discount: n })} />
                    </div>
                    <div className="col-span-1 flex flex-col items-end sm:col-span-2">
                      <Label className="w-full text-right text-xs text-muted-foreground">Total</Label>
                      <div className="flex w-full items-center justify-end gap-1">
                        <span className="truncate text-sm font-medium">{formatCurrency(lineTotal, currency)}</span>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive" onClick={() => removeRow(i)} aria-label="Remove">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addRow}>
              <Plus className="h-4 w-4" />
              Add product
            </Button>
          </div>

          {/* Totals + tax */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" rows={3} placeholder="Optional" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Sub total</span>
                <span className="font-medium">{formatCurrency(totals.subTotal, currency)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">Discount</span>
                <NumberField value={discount} onValueChange={setDiscount} className="h-8 w-28 text-right" />
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2 text-base font-bold">
                <span>Bill total</span>
                <span>{formatCurrency(totals.total, currency)}</span>
              </div>
              {selectedVendor && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Previous balance</span>
                  <span>{formatCurrency(previousBalance, currency)}</span>
                </div>
              )}
              {selectedVendor && (
                <div className="flex items-center justify-between text-sm font-bold">
                  <span>Grand total payable</span>
                  <span>{formatCurrency(grandTotalDue, currency)}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">Paid now</span>
                <NumberField value={paidAmount} onValueChange={setPaidAmount} className="h-8 w-28 text-right" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Balance due</span>
                {balanceDue <= 0 ? (
                  <span className="font-medium text-success">Clear / Paid</span>
                ) : (
                  <span className="font-medium text-warning">{formatCurrency(balanceDue, currency)}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" variant="secondary" loading={mutation.isPending} onClick={() => submit('DRAFT')}>
            Save draft
          </Button>
          <Button type="button" loading={mutation.isPending} onClick={() => submit('COMPLETED')}>
            Save &amp; complete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
