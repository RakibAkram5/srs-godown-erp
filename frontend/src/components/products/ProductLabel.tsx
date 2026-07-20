import { forwardRef } from 'react';
import Barcode from 'react-barcode';
import { QRCodeCanvas } from 'qrcode.react';
import type { Product } from '@/types';
import { formatCurrency } from '@/utils/formatters';

interface ProductLabelProps {
  product: Product;
  currency?: string;
}

/**
 * A compact product label (barcode + QR + name + price).
 * Rendered on a white background so it prints cleanly.
 */
export const ProductLabel = forwardRef<HTMLDivElement, ProductLabelProps>(
  ({ product, currency = 'PKR' }, ref) => {
    const code = product.barcode || product.productCode || product.sku || product.codeNo.toString();
    const qrValue = JSON.stringify({
      code: product.productCode,
      sku: product.sku,
      name: product.name,
    });

    return (
      <div
        ref={ref}
        className="mx-auto w-[320px] rounded-lg border border-slate-300 bg-white p-4 text-slate-900"
      >
        <p className="truncate text-center text-sm font-bold">{product.name}</p>
        <p className="mt-0.5 text-center text-xs text-slate-500">
          {product.sku ?? product.productCode}
        </p>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex-1 overflow-hidden">
            <Barcode
              value={code}
              format="CODE128"
              width={1.4}
              height={48}
              fontSize={11}
              margin={0}
              background="#ffffff"
            />
          </div>
          <QRCodeCanvas value={qrValue} size={72} level="M" includeMargin={false} />
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2 text-xs">
          <span className="text-slate-500">Price</span>
          <span className="text-base font-bold">{formatCurrency(product.salePrice, currency)}</span>
        </div>
      </div>
    );
  },
);
ProductLabel.displayName = 'ProductLabel';
