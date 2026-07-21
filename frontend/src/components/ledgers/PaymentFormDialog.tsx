import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { NumberField } from '@/components/ui/NumberField';
import { vendorsApi } from '@/services/vendors.service';
import { dealersApi } from '@/services/dealers.service';
import { paymentsApi, type PaymentPayload } from '@/services/payments.service';
import { toast } from '@/utils/toast';
import type { PaymentMethod, PaymentType } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: PaymentType; // VENDOR_PAYMENT or DEALER_RECEIPT
  presetPartyId?: string;
}

const METHODS: PaymentMethod[] = ['CASH', 'BANK', 'CARD', 'CHEQUE', 'OTHER'];

export function PaymentFormDialog({ open, onOpenChange, mode, presetPartyId }: Props) {
  const queryClient = useQueryClient();
  const isReceipt = mode === 'DEALER_RECEIPT';

  const [partyId, setPartyId] = useState('');
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  const { data: vendors } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => vendorsApi.list(undefined, 'active'),
    enabled: open && !isReceipt,
  });
  const { data: dealers } = useQuery({
    queryKey: ['dealers'],
    queryFn: () => dealersApi.list(undefined, 'active'),
    enabled: open && isReceipt,
  });
  const parties = (isReceipt ? dealers : vendors) ?? [];

  useEffect(() => {
    if (open) {
      setPartyId(presetPartyId ?? '');
      setAmount(0);
      setMethod('CASH');
      setDate(new Date().toISOString().slice(0, 10));
      setNotes('');
    }
  }, [open, presetPartyId]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload: PaymentPayload = {
        type: mode,
        amount,
        method,
        paymentDate: date,
        notes: notes || null,
        ...(isReceipt ? { dealerId: partyId } : { vendorId: partyId }),
      };
      return paymentsApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['dealers'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['dealer-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success(isReceipt ? 'Receipt recorded' : 'Payment recorded');
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error('Could not save', err.message),
  });

  function submit() {
    if (!partyId) return toast.error(isReceipt ? 'Dealer required' : 'Vendor required', 'Please choose one.');
    if (amount <= 0) return toast.error('Invalid amount', 'Amount must be greater than 0.');
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isReceipt ? 'Record receipt (money received)' : 'Record payment (money paid)'}</DialogTitle>
          <DialogDescription>
            {isReceipt ? 'Money received from a dealer reduces their outstanding balance.' : 'Money paid to a vendor reduces what you owe them.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="party">{isReceipt ? 'Dealer' : 'Vendor'}</Label>
            <Select id="party" value={partyId} onChange={(e) => setPartyId(e.target.value)} disabled={!!presetPartyId}>
              <option value="">— Select —</option>
              {parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <NumberField id="amount" value={amount} onValueChange={setAmount} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Method</Label>
              <Select id="method" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                {METHODS.map((m) => <option key={m} value={m}>{m.charAt(0) + m.slice(1).toLowerCase()}</option>)}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pdate">Date</Label>
            <Input id="pdate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pnotes">Notes</Label>
            <Textarea id="pnotes" rows={2} placeholder="Optional" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button loading={mutation.isPending} onClick={submit}>{isReceipt ? 'Record receipt' : 'Record payment'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
