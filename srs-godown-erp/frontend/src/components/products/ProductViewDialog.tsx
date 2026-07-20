import { useRef } from 'react';
import { Pencil, Printer } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { ProductLabel } from './ProductLabel';
import { formatCurrency, formatDate } from '@/utils/formatters';
import type { Product } from '@/types';

interface ProductViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  currency?: string;
  onEdit?: (product: Product) => void;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value ?? '—'}</p>
    </div>
  );
}

export function ProductViewDialog({ open, onOpenChange, product, currency = 'PKR', onEdit }: ProductViewDialogProps) {
  const labelRef = useRef<HTMLDivElement>(null);

  if (!product) return null;

  const handlePrint = () => {
    labelRef.current?.classList.add('print-target');
    window.print();
    // Remove after the print dialog closes.
    setTimeout(() => labelRef.current?.classList.remove('print-target'), 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>
            {product.productCode} · {product.sku}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="h-32 w-32 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/30">
              {product.image ? (
                <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  No image
                </div>
              )}
            </div>
            <div className="grid flex-1 grid-cols-2 gap-4">
              <Field label="Category" value={product.categoryName} />
              <Field label="Brand" value={product.brandName} />
              <Field label="Unit" value={product.unitName} />
              <Field
                label="Status"
                value={
                  <Badge variant={product.isActive ? 'success' : 'secondary'}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                }
              />
            </div>
          </div>

          {product.description && (
            <div>
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="mt-0.5 text-sm">{product.description}</p>
            </div>
          )}

          <Separator />

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Purchase price" value={formatCurrency(product.purchasePrice, currency)} />
            <Field label="Sale price" value={formatCurrency(product.salePrice, currency)} />
            <Field label="Opening stock" value={product.openingStock} />
            <Field label="Minimum stock" value={product.minimumStock} />
            <Field
              label="Current stock"
              value={
                <span className={product.isLowStock ? 'text-destructive' : undefined}>
                  {product.currentStock}
                  {product.isLowStock && ' (low)'}
                </span>
              }
            />
            <Field label="Warehouse" value={product.warehouse} />
            <Field label="Rack" value={product.rack} />
            <Field label="Shelf" value={product.shelf} />
          </div>

          {product.bikes.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs text-muted-foreground">Bike compatibility</p>
              <div className="flex flex-wrap gap-1.5">
                {product.bikes.map((b) => (
                  <Badge key={b} variant="info">{b}</Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Label with barcode + QR */}
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Label · Barcode · QR</p>
            <div ref={labelRef}>
              <ProductLabel product={product} currency={currency} />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">Added {formatDate(product.createdAt)}</p>
        </div>

        <DialogFooter className="no-print">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Print label
          </Button>
          {onEdit && (
            <Button
              onClick={() => {
                onOpenChange(false);
                onEdit(product);
              }}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
