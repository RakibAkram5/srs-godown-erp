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
import { dealersApi, type DealerPayload } from '@/services/dealers.service';
import { toast } from '@/utils/toast';
import type { Dealer } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'Dealer name is required'),
  phone: z.string().optional(),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  openingBalance: z.coerce.number(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealer?: Dealer | null;
}

export function DealerFormDialog({ open, onOpenChange, dealer }: Props) {
  const queryClient = useQueryClient();
  const editing = !!dealer;
  const [isActive, setIsActive] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', email: '', address: '', city: '', openingBalance: 0 },
  });

  useEffect(() => {
    if (!open) return;
    if (dealer) {
      reset({
        name: dealer.name,
        phone: dealer.phone ?? '',
        email: dealer.email ?? '',
        address: dealer.address ?? '',
        city: dealer.city ?? '',
        openingBalance: dealer.openingBalance,
      });
      setIsActive(dealer.isActive);
    } else {
      reset({ name: '', phone: '', email: '', address: '', city: '', openingBalance: 0 });
      setIsActive(true);
    }
  }, [open, dealer, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: DealerPayload = { ...values, isActive };
      return editing ? dealersApi.update(dealer!.id, payload) : dealersApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealers'] });
      toast.success(editing ? 'Dealer updated' : 'Dealer added');
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error('Could not save dealer', err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit dealer' : 'Add dealer'}</DialogTitle>
          <DialogDescription>Customers you sell spare parts to.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Dealer name</Label>
            <Input id="name" placeholder="e.g. Bismillah Motors" {...register('name')} />
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
            <Label htmlFor="city">City</Label>
            <Input id="city" placeholder="e.g. Lahore" {...register('city')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="openingBalance">Opening balance (dealer owes)</Label>
            <Input id="openingBalance" type="number" onFocus={(e) => e.target.select()} step="0.01" {...register('openingBalance')} />
            <p className="text-xs text-muted-foreground">Amount this dealer already owes you, if any.</p>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <p className="text-sm font-medium">Active</p>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" loading={mutation.isPending}>{editing ? 'Save changes' : 'Add dealer'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
