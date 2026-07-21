import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { NumberField } from '@/components/ui/NumberField';
import { dealersApi } from '@/services/dealers.service';
import { vendorsApi } from '@/services/vendors.service';
import { toast } from '@/utils/toast';

interface Props {
  target: { type: 'vendor' | 'dealer'; id: string; name: string } | null;
  onClose: () => void;
}

export function AdjustBalanceDialog({ target, onClose }: Props) {
  const queryClient = useQueryClient();
  const [direction, setDirection] = useState<'increase' | 'decrease'>('increase');
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (target) { setDirection('increase'); setAmount(0); setReason(''); }
  }, [target]);

  const mutation = useMutation({
    mutationFn: () => {
      const signed = direction === 'increase' ? amount : -amount;
      return target!.type === 'vendor'
        ? vendorsApi.adjust(target!.id, signed, reason)
        : dealersApi.adjust(target!.id, signed, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['dealers'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['dealer-ledger'] });
      toast.success('Balance adjusted');
      onClose();
    },
    onError: (err: Error) => toast.error('Could not adjust', err.message),
  });

  function submit() {
    if (amount <= 0) return toast.error('Invalid amount', 'Enter an amount greater than 0.');
    if (!reason.trim()) return toast.error('Reason required', 'Please add a reason for the adjustment.');
    mutation.mutate();
  }

  const owe = target?.type === 'vendor' ? 'you owe them' : 'they owe you';

  return (
    <Dialog open={!!target} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust balance — {target?.name}</DialogTitle>
          <DialogDescription>Manually correct the outstanding balance. This is recorded in the ledger.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="adir">Direction</Label>
              <Select id="adir" value={direction} onChange={(e) => setDirection(e.target.value as 'increase' | 'decrease')}>
                <option value="increase">Increase ({owe} more)</option>
                <option value="decrease">Decrease ({owe} less)</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="aamt">Amount</Label>
              <NumberField id="aamt" value={amount} onValueChange={setAmount} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="arsn">Reason</Label>
            <Textarea id="arsn" rows={2} placeholder="e.g. Opening balance correction, discount given, rounding…" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button loading={mutation.isPending} onClick={submit}>Apply adjustment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
