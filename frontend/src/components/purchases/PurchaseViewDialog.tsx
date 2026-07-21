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
import { purchasesApi } from '@/services/purchases.service';
import { settingsService } from '@/services/settings.service';
import { DEFAULT_COMPANY_NAME, INVOICE_FOOTER } from '@/lib/invoice';
import { purchaseInvoicePdf } from '@/utils/purchaseDocs';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { toast } from '@/utils/toast';
import type { Purchase } from '@/types';

interface Props {
  purchaseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (purchase: Purchase) => void;
  onReturn?: (purchase: Purchase) => void;
}

export function PurchaseViewDialog({ purchaseId, open, onOpenChange, onEdit, onReturn }: Props) {
  const queryClient = useQueryClient();
  const invoiceRef = useRef<HTMLDivElement>(null);

  const { data: purchase, isLoading } = useQuery({
    queryKey: ['purchase', purchaseId],
    queryFn: () => purchasesApi.get(purchaseId!),
    enabled: !!purchaseId && open,
  });
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: settingsService.get, retry: false });
  const currency = settings?.currency ?? 'PKR';
  const companyName = settings?.companyName || DEFAULT_COMPANY_NAME;
  const companyLogo = settings?.companyLogo;

  const completeMutation = useMutation({
    mutationFn: () => purchasesApi.complete(purchase!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['purchase', purchaseId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Purchase completed — stock updated');
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
          <DialogTitle>Purchase {purchase?.purchaseNo ?? ''}</DialogTitle>
          <DialogDescription>Purchase invoice details.</DialogDescription>
        </DialogHeader>

        {isLoading || !purchase ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : (
          <>
            <div ref={invoiceRef} className="rounded-lg border border-border bg-background p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {companyLogo ? <img src={companyLogo} alt="Logo" className="h-14 w-14 rounded object-contain" /> : null}
                  <div>
                    <p className="text-xl font-bold">{companyName}</p>
                    <p className="text-sm text-muted-foreground">Purchase Invoice</p>
                  </div>
                </div>
                <Badge variant={purchase.status === 'COMPLETED' ? 'success' : 'secondary'}>
                  {purchase.status === 'COMPLETED' ? 'Completed' : 'Draft'}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <p><span className="text-muted-foreground">No:</span> <span className="font-medium">{purchase.purchaseNo}</span></p>
                <p><span className="text-muted-foreground">Date:</span> {formatDate(purchase.purchaseDate)}</p>
                <p><span className="text-muted-foreground">Vendor:</span> <span className="font-medium">{purchase.vendor?.name}</span></p>
                {(purchase.warehouse || purchase.rack || purchase.shelf) && (
                  <p><span className="text-muted-foreground">Location:</span> {[purchase.warehouse, purchase.rack, purchase.shelf].filter(Boolean).join(' / ')}</p>
                )}
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
                    {(purchase.items ?? []).map((it) => (
                      <TableRow key={it.id ?? it.productId}>
                        <TableCell className="font-medium">{it.productName}</TableCell>
                        <TableCell className="text-center">{it.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(it.purchasePrice, currency)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Math.max(0, it.quantity * it.purchasePrice - it.discount), currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Sub total</span><span>{formatCurrency(purchase.subTotal, currency)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>{formatCurrency(purchase.discount, currency)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatCurrency(purchase.taxAmount, currency)}</span></div>
                <div className="flex justify-between border-t border-border pt-1 text-base font-bold"><span>Bill total</span><span>{formatCurrency(purchase.totalAmount, currency)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="text-success">{formatCurrency(purchase.paidAmount, currency)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">On credit (remaining)</span><span className="font-medium text-warning">{formatCurrency(Math.max(0, purchase.totalAmount - purchase.paidAmount), currency)}</span></div>
                <div className="flex justify-between border-t border-dashed border-border pt-1"><span className="text-muted-foreground">Previous balance</span><span>{formatCurrency(purchase.previousBalance, currency)}</span></div>
                <div className="flex justify-between text-base font-bold"><span>Grand total payable</span><span>{formatCurrency(purchase.previousBalance + Math.max(0, purchase.totalAmount - purchase.paidAmount), currency)}</span></div>
              </div>

              {purchase.notes && <p className="mt-4 text-sm text-muted-foreground">Notes: {purchase.notes}</p>}

              <div className="mt-6 border-t border-border pt-2 text-center text-xs text-muted-foreground">
                Developed by <span className="font-medium text-foreground">{INVOICE_FOOTER.developedBy}</span> · Contact: {INVOICE_FOOTER.contact}
              </div>
            </div>

            <DialogFooter className="no-print flex-wrap">
              <Button variant="outline" onClick={handlePrint}><Printer className="h-4 w-4" />Print</Button>
              <Button variant="outline" onClick={() => purchaseInvoicePdf(purchase, { companyName, currency })}><Download className="h-4 w-4" />Save PDF</Button>
              {purchase.status === 'DRAFT' && (
                <>
                  <Button variant="outline" onClick={() => { onOpenChange(false); onEdit?.(purchase); }}>
                    <Pencil className="h-4 w-4" />Edit
                  </Button>
                  <Button loading={completeMutation.isPending} onClick={() => completeMutation.mutate()}>
                    <CheckCircle2 className="h-4 w-4" />Complete
                  </Button>
                </>
              )}
              {purchase.status === 'COMPLETED' && onReturn && (
                <Button variant="outline" onClick={() => { onOpenChange(false); onReturn(purchase); }}>
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
