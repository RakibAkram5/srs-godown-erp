import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Printer, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { settingsService } from '@/services/settings.service';
import { DEFAULT_COMPANY_NAME, INVOICE_FOOTER } from '@/lib/invoice';
import { dispatchPdf } from '@/utils/dispatchDocs';
import { formatDate } from '@/utils/formatters';
import type { Dispatch } from '@/types';

interface Props {
  dispatch: Dispatch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DispatchViewDialog({ dispatch, open, onOpenChange }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: settingsService.get, retry: false });
  const companyName = settings?.companyName || DEFAULT_COMPANY_NAME;
  const companyLogo = settings?.companyLogo;

  function handlePrint() {
    printRef.current?.classList.add('print-target');
    window.print();
    setTimeout(() => printRef.current?.classList.remove('print-target'), 500);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-xl overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>Dispatch {dispatch?.dispatchNo ?? ''}</DialogTitle>
          <DialogDescription>Bilty / transport record details.</DialogDescription>
        </DialogHeader>

        {!dispatch ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : (
          <>
            <div ref={printRef} className="rounded-lg border border-border bg-background p-5">
              <div className="flex items-center gap-3">
                {companyLogo ? <img src={companyLogo} alt="Logo" className="h-12 w-12 rounded object-contain" /> : null}
                <div>
                  <p className="text-lg font-bold">{companyName}</p>
                  <p className="text-sm text-muted-foreground">Dispatch / Bilty Record</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <p><span className="text-muted-foreground">Dispatch No:</span> <span className="font-medium">{dispatch.dispatchNo}</span></p>
                <p><span className="text-muted-foreground">Date:</span> {formatDate(dispatch.dispatchDate)}</p>
                <p><span className="text-muted-foreground">Bilty No:</span> <span className="font-medium">{dispatch.biltyNumber}</span></p>
                <p><span className="text-muted-foreground">City:</span> {dispatch.city}</p>
                <p><span className="text-muted-foreground">Transporter:</span> {dispatch.transporterName}</p>
                <p><span className="text-muted-foreground">Invoice:</span> {dispatch.sale?.saleNo ?? '—'}</p>
                <p className="col-span-2">
                  <span className="text-muted-foreground">Dealer/Customer:</span>{' '}
                  <span className="font-medium">{dispatch.sale?.dealer?.name || dispatch.sale?.customerName || 'Walk-in'}</span>
                  {dispatch.sale?.dealer?.city && <span className="text-muted-foreground"> ({dispatch.sale.dealer.city})</span>}
                </p>
              </div>

              {dispatch.notes && <p className="mt-4 text-sm text-muted-foreground">Notes: {dispatch.notes}</p>}

              {dispatch.images.length > 0 && (
                <div className="dispatch-images mt-4">
                  <p className="mb-2 text-sm font-medium">Bilty images</p>
                  <div className="flex flex-wrap gap-2">
                    {dispatch.images.map((src, i) => (
                      <button
                        key={i}
                        type="button"
                        className="h-20 w-20 overflow-hidden rounded-md border border-border"
                        onClick={() => setLightbox(src)}
                      >
                        <img src={src} alt={`Bilty ${i + 1}`} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 border-t border-border pt-2 text-center text-xs text-muted-foreground">
                Developed by <span className="font-medium text-foreground">{INVOICE_FOOTER.developedBy}</span> · Contact: {INVOICE_FOOTER.contact}
              </div>
            </div>

            <DialogFooter className="no-print flex-wrap">
              <Button variant="outline" onClick={handlePrint}><Printer className="h-4 w-4" />Print</Button>
              <Button variant="outline" onClick={() => dispatchPdf(dispatch, { companyName, companyLogo })}><Download className="h-4 w-4" />Save PDF</Button>
            </DialogFooter>
          </>
        )}

        {lightbox && (
          <div
            className="no-print fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-6"
            onClick={() => setLightbox(null)}
          >
            <button className="absolute right-4 top-4 text-white" onClick={() => setLightbox(null)} aria-label="Close">
              <X className="h-6 w-6" />
            </button>
            <img src={lightbox} alt="Bilty full size" className="max-h-full max-w-full rounded-md object-contain" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
