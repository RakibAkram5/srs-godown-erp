import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Switch } from '@/components/ui/switch';
import { vendorsApi, type VendorPayload } from '@/services/vendors.service';
import { toast } from '@/utils/toast';
import type { Vendor } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'Vendor name is required'),
  phone: z.string().optional(),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  address: z.string().optional(),
  openingBalance: z.coerce.number(),
  isActive: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor?: Vendor | null;
}

export function VendorFormDialog({ open, onOpenChange, vendor }: Props) {
  const queryClient = useQueryClient();
  const editing = !!vendor;
  const [isActive, setIsActive] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', email: '', address: '', openingBalance: 0, isActive: true },
  });

  useEffect(() => {
    if (!open) return;
    if (vendor) {
      reset({
        name: vendor.name,
        phone: vendor.phone ?? '',
        email: vendor.email ?? '',
        address: vendor.address ?? '',
        openingBalance: vendor.openingBalance,
        isActive: vendor.isActive,
      });
      setIsActive(vendor.isActive);
    } else {
      reset({ name: '', phone: '', email: '', address: '', openingBalance: 0, isActive: true });
      setIsActive(true);
    }
  }, [open, vendor, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: VendorPayload = { ...values, isActive };
      return editing ? vendorsApi.update(vendor!.id, payload) : vendorsApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success(editing ? 'Vendor updated' : 'Vendor added');
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error('Could not save vendor', err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit vendor' : 'Add vendor'}</DialogTitle>
          <DialogDescription>Suppliers you buy spare parts from.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Vendor name</Label>
            <Input id="name" placeholder="e.g. Al-Madina Auto Parts" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="+92 300 0000000" {...register('phone')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Optional" {...register('email')} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" rows={2} placeholder="Optional" {...register('address')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="openingBalance">Opening balance (outstanding)</Label>
            <Input id="openingBalance" type="number" onFocus={(e) => e.target.select()} step="0.01" {...register('openingBalance')} />
            <p className="text-xs text-muted-foreground">Amount you already owe this vendor, if any.</p>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <p className="text-sm font-medium">Active</p>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" loading={mutation.isPending}>
              {editing ? 'Save changes' : 'Add vendor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
