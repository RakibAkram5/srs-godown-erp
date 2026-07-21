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
import { salesApi } from '@/services/sales.service';
import { dispatchesApi, type DispatchPayload } from '@/services/dispatches.service';
import type { Dispatch } from '@/types';
import { toast } from '@/utils/toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presetSaleId?: string;
  editing?: Dispatch | null;
}

export function DispatchFormDialog({ open, onOpenChange, presetSaleId, editing }: Props) {
  const queryClient = useQueryClient();
  const [saleId, setSaleId] = useState('');
  const [biltyNumber, setBiltyNumber] = useState('');
  const [transporterName, setTransporterName] = useState('');
  const [city, setCity] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  const { data: sales } = useQuery({
    queryKey: ['sales-completed'],
    queryFn: () => salesApi.list({ status: 'COMPLETED', limit: 1000, sortBy: 'saleDate', sortOrder: 'desc' }),
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      if (editing) {
        setSaleId(editing.saleId);
        setBiltyNumber(editing.biltyNumber); setTransporterName(editing.transporterName); setCity(editing.city);
        setDate(editing.dispatchDate.slice(0, 10)); setNotes(editing.notes ?? '');
      } else {
        setSaleId(presetSaleId ?? '');
        setBiltyNumber(''); setTransporterName(''); setCity('');
        setDate(new Date().toISOString().slice(0, 10));
        setNotes('');
      }
    }
  }, [open, presetSaleId, editing]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload: DispatchPayload = { saleId, biltyNumber, transporterName, city, dispatchDate: date, notes: notes || null };
      return editing ? dispatchesApi.update(editing.id, payload) : dispatchesApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatches'] });
      toast.success(editing ? 'Dispatch updated' : 'Dispatch recorded');
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error('Could not save dispatch', err.message),
  });

  function submit() {
    if (!saleId) return toast.error('Invoice required', 'Select a sale invoice.');
    if (!biltyNumber.trim()) return toast.error('Bilty required', 'Enter the bilty number.');
    if (!transporterName.trim()) return toast.error('Transporter required', 'Enter the transporter name.');
    if (!city.trim()) return toast.error('City required', 'Enter the destination city.');
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit dispatch' : 'Record dispatch'}</DialogTitle>
          <DialogDescription>Link a bilty to a sale invoice for your transport record.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sale">Sale invoice</Label>
            <Select id="sale" value={saleId} onChange={(e) => setSaleId(e.target.value)} disabled={!!presetSaleId && !editing}>
              <option value="">— Select invoice —</option>
              {(sales?.items ?? []).map((s) => (
                <option key={s.id} value={s.id}>{s.saleNo} — {s.dealer?.name || s.customerName || 'Walk-in'}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bilty">Bilty number</Label>
              <Input id="bilty" placeholder="e.g. BLT-3391" value={biltyNumber} onChange={(e) => setBiltyNumber(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Destination city</Label>
              <Input id="city" placeholder="e.g. Lahore" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transporter">Transporter name</Label>
              <Input id="transporter" placeholder="e.g. Al-Makkah Goods" value={transporterName} onChange={(e) => setTransporterName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ddate">Dispatch date</Label>
              <Input id="ddate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dnotes">Notes</Label>
            <Textarea id="dnotes" rows={2} placeholder="Optional" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button loading={mutation.isPending} onClick={submit}>{editing ? 'Save changes' : 'Record dispatch'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
