import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { salesApi } from '@/services/sales.service';
import { formatCurrency } from '@/utils/formatters';
import { toast } from '@/utils/toast';
import type { Sale } from '@/types';

interface Props {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency?: string;
}

export function SaleReturnDialog({ sale, open, onOpenChange, currency = 'PKR' }: Props) {
  const queryClient = useQueryClient();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) { setQty({}); setNotes(''); }
  }, [open, sale]);

  const items = sale?.items ?? [];
  const total = useMemo(
    () => items.reduce((s, it) => s + (qty[it.productId] || 0) * it.salePrice, 0),
    [items, qty],
  );

  const mutation = useMutation({
    mutationFn: () => {
      const returnItems = items
        .filter((it) => (qty[it.productId] || 0) > 0)
        .map((it) => ({ productId: it.productId, productName: it.productName, quantity: qty[it.productId], price: it.salePrice }));
      return salesApi.createReturn({ saleId: sale!.id, notes: notes || null, items: returnItems });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sale-returns'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      toast.success('Return recorded — stock updated');
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error('Could not record return', err.message),
  });

  function submit() {
    const any = items.some((it) => (qty[it.productId] || 0) > 0);
    if (!any) return toast.error('Nothing to return', 'Enter a quantity for at least one item.');
    for (const it of items) {
      if ((qty[it.productId] || 0) > it.quantity) {
        return toast.error('Too many', `Cannot return more than ${it.quantity} of ${it.productName}.`);
      }
    }
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Return items — {sale?.saleNo}</DialogTitle>
          <DialogDescription>Returned quantities go back into stock.</DialogDescription>
        </DialogHeader>

        <div className="overflow-x-auto scrollbar-thin">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-center">Sold</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="w-32 text-center">Return qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it.productId}>
                  <TableCell className="font-medium">{it.productName}</TableCell>
                  <TableCell className="text-center">{it.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(it.salePrice, currency)}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      max={it.quantity}
                      value={qty[it.productId] ?? 0}
                      onChange={(e) => setQty((prev) => ({ ...prev, [it.productId]: Math.max(0, Math.min(it.quantity, Number(e.target.value))) }))}
                      className="h-9 text-center"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-2">
          <Label htmlFor="srnotes">Notes</Label>
          <Textarea id="srnotes" rows={2} placeholder="Optional" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
          <span className="text-muted-foreground">Return total</span>
          <span className="text-base font-bold">{formatCurrency(total, currency)}</span>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button loading={mutation.isPending} onClick={submit}>Record return</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
