import { useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Download, Pencil, Printer, Undo2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { salesApi } from '@/services/sales.service';
import { settingsService } from '@/services/settings.service';
import { saleInvoicePdf } from '@/utils/saleDocs';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { toast } from '@/utils/toast';
import type { Sale } from '@/types';

interface Props {
  saleId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (sale: Sale) => void;
  onReturn?: (sale: Sale) => void;
}

export function SaleViewDialog({ saleId, open, onOpenChange, onEdit, onReturn }: Props) {
  const queryClient = useQueryClient();
  const invoiceRef = useRef<HTMLDivElement>(null);

  const { data: sale, isLoading } = useQuery({
    queryKey: ['sale', saleId],
    queryFn: () => salesApi.get(saleId!),
    enabled: !!saleId && open,
  });
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: settingsService.get, retry: false });
  const currency = settings?.currency ?? 'PKR';
  const companyName = settings?.companyName ?? 'SRS Godown ERP';

  const completeMutation = useMutation({
    mutationFn: () => salesApi.complete(sale!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sale', saleId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Sale completed — stock updated');
    },
    onError: (err: Error) => toast.error('Could not complete', err.message),
  });

  function handlePrint() {
    invoiceRef.current?.classList.add('print-target');
    window.print();
    setTimeout(() => invoiceRef.current?.classList.remove('print-target'), 500);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>Sale {sale?.saleNo ?? ''}</DialogTitle>
          <DialogDescription>Sale invoice details.</DialogDescription>
        </DialogHeader>

        {isLoading || !sale ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : (
          <>
            <div ref={invoiceRef} className="rounded-lg border border-border bg-background p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-bold">{companyName}</p>
                  <p className="text-sm text-muted-foreground">Sale Invoice</p>
                </div>
                <Badge variant={sale.status === 'COMPLETED' ? 'success' : 'secondary'}>
                  {sale.status === 'COMPLETED' ? 'Completed' : 'Draft'}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <p><span className="text-muted-foreground">No:</span> <span className="font-medium">{sale.saleNo}</span></p>
                <p><span className="text-muted-foreground">Date:</span> {formatDate(sale.saleDate)}</p>
                <p><span className="text-muted-foreground">Customer:</span> <span className="font-medium">{sale.customerName || 'Walk-in'}</span></p>
                {sale.customerPhone && <p><span className="text-muted-foreground">Phone:</span> {sale.customerPhone}</p>}
              </div>

              <div className="mt-4 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(sale.items ?? []).map((it) => (
                      <TableRow key={it.id ?? it.productId}>
                        <TableCell className="font-medium">{it.productName}</TableCell>
                        <TableCell className="text-center">{it.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(it.salePrice, currency)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Math.max(0, it.quantity * it.salePrice - it.discount), currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Sub total</span><span>{formatCurrency(sale.subTotal, currency)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>{formatCurrency(sale.discount, currency)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatCurrency(sale.taxAmount, currency)}</span></div>
                <div className="flex justify-between border-t border-border pt-1 text-base font-bold"><span>Total</span><span>{formatCurrency(sale.totalAmount, currency)}</span></div>
              </div>

              {sale.notes && <p className="mt-4 text-sm text-muted-foreground">Notes: {sale.notes}</p>}
            </div>

            <DialogFooter className="no-print flex-wrap">
              <Button variant="outline" onClick={handlePrint}><Printer className="h-4 w-4" />Print</Button>
              <Button variant="outline" onClick={() => saleInvoicePdf(sale, { companyName, currency })}>
                <Download className="h-4 w-4" />PDF
              </Button>
              {sale.status === 'DRAFT' && (
                <>
                  <Button variant="outline" onClick={() => { onOpenChange(false); onEdit?.(sale); }}>
                    <Pencil className="h-4 w-4" />Edit
                  </Button>
                  <Button loading={completeMutation.isPending} onClick={() => completeMutation.mutate()}>
                    <CheckCircle2 className="h-4 w-4" />Complete
                  </Button>
                </>
              )}
              {sale.status === 'COMPLETED' && onReturn && (
                <Button variant="outline" onClick={() => { onOpenChange(false); onReturn(sale); }}>
                  <Undo2 className="h-4 w-4" />Return
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
