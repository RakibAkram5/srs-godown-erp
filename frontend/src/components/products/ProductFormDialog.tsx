import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Trash2 } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { categoriesApi, brandsApi, unitsApi } from '@/services/masters.service';
import { productsApi, type ProductPayload } from '@/services/products.service';
import { toast } from '@/utils/toast';
import { BIKES, type Product } from '@/types';
import { cn } from '@/lib/utils';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const schema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  unitId: z.string().optional(),
  warehouse: z.string().optional(),
  rack: z.string().optional(),
  shelf: z.string().optional(),
  purchasePrice: z.coerce.number().min(0, 'Cannot be negative'),
  salePrice: z.coerce.number().min(0, 'Cannot be negative'),
  openingStock: z.coerce.number().int().min(0),
  minimumStock: z.coerce.number().int().min(0),
  currentStock: z.coerce.number().int().min(0),
  isActive: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
}

const emptyValues: FormValues = {
  name: '',
  description: '',
  categoryId: '',
  brandId: '',
  unitId: '',
  warehouse: '',
  rack: '',
  shelf: '',
  purchasePrice: 0,
  salePrice: 0,
  openingStock: 0,
  minimumStock: 0,
  currentStock: 0,
  isActive: true,
};

export function ProductFormDialog({ open, onOpenChange, product }: ProductFormDialogProps) {
  const queryClient = useQueryClient();
  const editing = !!product;
  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [bikes, setBikes] = useState<string[]>([]);

  const { data: categories } = useQuery({ queryKey: ['masters', 'categories'], queryFn: categoriesApi.list });
  const { data: brands } = useQuery({ queryKey: ['masters', 'brands'], queryFn: brandsApi.list });
  const { data: units } = useQuery({ queryKey: ['masters', 'units'], queryFn: unitsApi.list });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: emptyValues });

  useEffect(() => {
    if (!open) return;
    if (product) {
      reset({
        name: product.name,
        description: product.description ?? '',
        categoryId: product.categoryId ?? '',
        brandId: product.brandId ?? '',
        unitId: product.unitId ?? '',
        warehouse: product.warehouse ?? '',
        rack: product.rack ?? '',
        shelf: product.shelf ?? '',
        purchasePrice: product.purchasePrice,
        salePrice: product.salePrice,
        openingStock: product.openingStock,
        minimumStock: product.minimumStock,
        currentStock: product.currentStock,
        isActive: product.isActive,
      });
      setImage(product.image ?? null);
      setBikes(product.bikes ?? []);
    } else {
      reset(emptyValues);
      setImage(null);
      setBikes([]);
    }
  }, [open, product, reset]);

  const pickImage = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Invalid file', 'Choose an image file.');
    if (file.size > MAX_IMAGE_BYTES) return toast.error('Image too large', 'Max 2 MB.');
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const toggleBike = (bike: string) =>
    setBikes((prev) => (prev.includes(bike) ? prev.filter((b) => b !== bike) : [...prev, bike]));

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: ProductPayload = { ...values, image, bikes };
      return editing ? productsApi.update(product!.id, payload) : productsApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(editing ? 'Product updated' : 'Product added');
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error('Could not save product', err.message),
  });

  const isActive = watch('isActive');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit product' : 'Add product'}</DialogTitle>
          <DialogDescription>
            {editing ? 'Update this product’s details.' : 'Product code, SKU and barcode are generated automatically.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-5">
          {/* Image + name */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/30">
                {image ? (
                  <img src={image} alt="Product" className="h-full w-full object-cover" />
                ) : (
                  <ImagePlus className="h-7 w-7 text-muted-foreground" />
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickImage(e.target.files?.[0])} />
              <div className="flex gap-1">
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  Upload
                </Button>
                {image && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setImage(null)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product name</Label>
                <Input id="name" placeholder="e.g. Front Brake Cable" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" rows={2} placeholder="Optional" {...register('description')} />
              </div>
            </div>
          </div>

          {/* Category / Brand / Unit */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <Select id="categoryId" {...register('categoryId')}>
                <option value="">— None —</option>
                {(categories ?? []).filter((c) => c.isActive).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brandId">Brand</Label>
              <Select id="brandId" {...register('brandId')}>
                <option value="">— None —</option>
                {(brands ?? []).filter((b) => b.isActive).map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitId">Unit</Label>
              <Select id="unitId" {...register('unitId')}>
                <option value="">— None —</option>
                {(units ?? []).filter((u) => u.isActive).map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </Select>
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="warehouse">Warehouse</Label>
              <Input id="warehouse" placeholder="e.g. Main" {...register('warehouse')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rack">Rack</Label>
              <Input id="rack" placeholder="e.g. R1" {...register('rack')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shelf">Shelf</Label>
              <Input id="shelf" placeholder="e.g. S2" {...register('shelf')} />
            </div>
          </div>

          {/* Bike compatibility */}
          <div className="space-y-2">
            <Label>Bike compatibility</Label>
            <div className="flex flex-wrap gap-2">
              {BIKES.map((bike) => {
                const selected = bikes.includes(bike);
                return (
                  <button
                    type="button"
                    key={bike}
                    onClick={() => toggleBike(bike)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                      selected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/40',
                    )}
                  >
                    {bike}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pricing + stock */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase price</Label>
              <Input id="purchasePrice" type="number" onFocus={(e) => e.target.select()} step="0.01" {...register('purchasePrice')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salePrice">Sale price</Label>
              <Input id="salePrice" type="number" onFocus={(e) => e.target.select()} step="0.01" {...register('salePrice')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="openingStock">Opening stock</Label>
              <Input id="openingStock" type="number" onFocus={(e) => e.target.select()} {...register('openingStock')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minimumStock">Minimum stock</Label>
              <Input id="minimumStock" type="number" onFocus={(e) => e.target.select()} {...register('minimumStock')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentStock">Current stock</Label>
              <Input id="currentStock" type="number" onFocus={(e) => e.target.select()} {...register('currentStock')} disabled={!editing} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">Inactive products are hidden from selection later.</p>
            </div>
            <Switch checked={isActive} onCheckedChange={(c) => setValue('isActive', c)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              {editing ? 'Save changes' : 'Add product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
