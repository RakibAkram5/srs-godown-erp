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
import { productsApi } from '@/services/products.service';
import { dealersApi } from '@/services/dealers.service';
import { salesApi, type SalePayload } from '@/services/sales.service';
import { settingsService } from '@/services/settings.service';
import { formatCurrency } from '@/utils/formatters';
import { toast } from '@/utils/toast';
import type { Sale, TaxType } from '@/types';

interface Row {
  productId: string;
  productName: string;
  quantity: number;
  salePrice: number;
  discount: number;
  available: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale?: Sale | null;
}

const emptyRow: Row = { productId: '', productName: '', quantity: 1, salePrice: 0, discount: 0, available: 0 };

export function SaleFormDialog({ open, onOpenChange, sale }: Props) {
  const queryClient = useQueryClient();
  const editing = !!sale;

  const [dealerId, setDealerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<Row[]>([{ ...emptyRow }]);
  const [discount, setDiscount] = useState(0);
  const [taxType, setTaxType] = useState<TaxType>('NONE');
  const [taxValue, setTaxValue] = useState(0);
  const [notes, setNotes] = useState('');
  const [paidAmount, setPaidAmount] = useState(0);

  const { data: productData } = useQuery({
    queryKey: ['products-picker'],
    queryFn: () => productsApi.list({ status: 'active', limit: 100000, sortBy: 'name', sortOrder: 'asc' }),
  });
  const products = productData?.items ?? [];
  const { data: dealers } = useQuery({ queryKey: ['dealers'], queryFn: () => dealersApi.list(undefined, 'active') });
  const selectedDealer = (dealers ?? []).find((d) => d.id === dealerId);
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: settingsService.get, retry: false });
  const currency = settings?.currency ?? 'PKR';

  useEffect(() => {
    if (!open) return;
    if (sale) {
      setDealerId(sale.dealerId ?? '');
      setCustomerName(sale.customerName ?? '');
      setCustomerPhone(sale.customerPhone ?? '');
      setSaleDate(sale.saleDate.slice(0, 10));
      setRows(
        (sale.items ?? []).map((it) => {
          const p = products.find((x) => x.id === it.productId);
          return {
            productId: it.productId,
            productName: it.productName,
            quantity: it.quantity,
            salePrice: it.salePrice,
            discount: it.discount,
            available: p?.currentStock ?? 0,
          };
        }) || [{ ...emptyRow }],
      );
      setDiscount(sale.discount);
      setTaxType(sale.taxType);
      setTaxValue(sale.taxValue);
      setNotes(sale.notes ?? '');
      setPaidAmount(sale.paidAmount ?? 0);
    } else {
      setDealerId('');
      setCustomerName(''); setCustomerPhone('');
      setSaleDate(new Date().toISOString().slice(0, 10));
      setRows([{ ...emptyRow }]);
      setDiscount(0); setTaxType('NONE'); setTaxValue(0); setNotes(''); setPaidAmount(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sale]);

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }
  function onPickProduct(index: number, productId: string) {
    const product = products.find((p) => p.id === productId);
    if (product && product.currentStock <= 0) {
      toast.error('Out of stock', `"${product.name}" ka stock 0 hai — pehle purchase karke stock barhayein, tab hi add ho sakti hai.`);
      updateRow(index, { productId: '', productName: '', salePrice: 0, available: 0 });
      return;
    }
    updateRow(index, {
      productId,
      productName: product?.name ?? '',
      salePrice: product?.salePrice ?? 0,
      available: product?.currentStock ?? 0,
    });
  }
  function addRow() {
    setRows((prev) => [...prev, { ...emptyRow }]);
  }
  function removeRow(index: number) {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  const totals = useMemo(() => {
    const valid = rows.filter((r) => r.productId && r.quantity > 0);
    const subTotal = valid.reduce((s, r) => s + Math.max(0, r.quantity * r.salePrice - r.discount), 0);
    const afterDiscount = Math.max(0, subTotal - discount);
    let taxAmount = 0;
    if (taxType === 'PERCENT') taxAmount = (afterDiscount * taxValue) / 100;
    else if (taxType === 'FIXED') taxAmount = taxValue;
    return { subTotal, taxAmount, total: afterDiscount + taxAmount };
  }, [rows, discount, taxType, taxValue]);

  const mutation = useMutation({
    mutationFn: ({ status }: { status: 'DRAFT' | 'COMPLETED' }) => {
      const items = rows
        .filter((r) => r.productId && r.quantity > 0)
        .map((r) => ({ productId: r.productId, productName: r.productName, quantity: r.quantity, salePrice: r.salePrice, discount: r.discount }));
      const payload: SalePayload = {
        dealerId: dealerId || null,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        saleDate,
        discount,
        taxType,
        taxValue,
        paidAmount,
        notes: notes || null,
        status,
        items,
      };
      return editing ? salesApi.update(sale!.id, payload) : salesApi.create(payload);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(variables.status === 'COMPLETED' ? 'Sale completed — stock updated' : 'Sale saved as draft');
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error('Could not save sale', err.message),
  });

  function submit(status: 'DRAFT' | 'COMPLETED') {
    const valid = rows.filter((r) => r.productId && r.quantity > 0);
    if (valid.length === 0) return toast.error('No items', 'Add at least one product with quantity.');
    // Low stock no longer blocks — the shortfall is recorded as pending.
    mutation.mutate({ status });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit Sale ${sale?.saleNo ?? ''}` : 'New Sale'}</DialogTitle>
          <DialogDescription>Add products, then save as draft or complete to reduce stock.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dealer">Dealer (optional)</Label>
              <Select id="dealer" value={dealerId} onChange={(e) => setDealerId(e.target.value)}>
                <option value="">Walk-in / cash customer</option>
                {(dealers ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sdate">Sale date</Label>
              <Input id="sdate" type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cname">Customer name {dealerId ? '(optional)' : ''}</Label>
              <Input id="cname" placeholder={dealerId ? 'Contact person' : 'Walk-in'} value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cphone">Customer phone</Label>
              <Input id="cphone" placeholder="Optional" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Products</Label>
            <div className="space-y-2">
              {rows.map((row, i) => {
                const lineTotal = Math.max(0, row.quantity * row.salePrice - row.discount);
                const over = row.productId && row.quantity > row.available;
                return (
                  <div key={i} className="grid grid-cols-12 items-end gap-2 rounded-md border border-border p-2">
                    <div className="col-span-12 sm:col-span-4">
                      <Label className="text-xs text-muted-foreground">Product</Label>
                      <Select value={row.productId} onChange={(e) => onPickProduct(i, e.target.value)}>
                        <option value="">— Select —</option>
                        {products.map((p) => <option key={p.id} value={p.id} disabled={p.currentStock <= 0}>{p.name} {p.currentStock <= 0 ? '(out of stock)' : `(stock: ${p.currentStock})`}</option>)}
                      </Select>
                    </div>
                    <div className="col-span-3 sm:col-span-2">
                      <Label className="text-xs text-muted-foreground">Qty</Label>
                      <NumberField value={row.quantity} onValueChange={(n) => updateRow(i, { quantity: n })} allowDecimal={false} className={over ? 'border-warning' : ''} />
                      {over ? <p className="mt-0.5 text-[11px] text-warning">{row.available} in stock · rest goes to pending</p> : null}
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <Label className="text-xs text-muted-foreground">Price</Label>
                      <NumberField value={row.salePrice} onValueChange={(n) => updateRow(i, { salePrice: n })} />
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" rows={3} placeholder="Optional" value={notes} onChange={(e) => setNotes(e.target.value)} />
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
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">Tax</span>
                <div className="flex items-center gap-1">
                  <Select className="h-8 w-24" value={taxType} onChange={(e) => setTaxType(e.target.value as TaxType)}>
                    <option value="NONE">None</option>
                    <option value="PERCENT">%</option>
                    <option value="FIXED">Fixed</option>
                  </Select>
                  <NumberField value={taxValue} onValueChange={setTaxValue} disabled={taxType === 'NONE'} className="h-8 w-24 text-right" />
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tax amount</span>
                <span className="font-medium">{formatCurrency(totals.taxAmount, currency)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2 text-base font-bold">
                <span>Total</span>
                <span>{formatCurrency(totals.total, currency)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">Paid now</span>
                <NumberField value={paidAmount} onValueChange={setPaidAmount} className="h-8 w-28 text-right" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Remaining (this bill)</span>
                <span className="font-medium text-warning">{formatCurrency(Math.max(0, totals.total - paidAmount), currency)}</span>
              </div>
              {selectedDealer && (
                <div className="mt-1 space-y-1 border-t border-dashed border-border pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Previous balance</span>
                    <span>{formatCurrency(selectedDealer.balance, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span>Grand total (with previous)</span>
                    <span>{formatCurrency(selectedDealer.balance + Math.max(0, totals.total - paidAmount), currency)}</span>
                  </div>
                </div>
              )}
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
