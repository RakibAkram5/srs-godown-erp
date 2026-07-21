import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownLeft, ArrowUpRight, BookOpen, Download, Plus, Scale, Truck, Store } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PaymentFormDialog } from '@/components/ledgers/PaymentFormDialog';
import { AdjustBalanceDialog } from '@/components/ledgers/AdjustBalanceDialog';
import { vendorsApi } from '@/services/vendors.service';
import { dealersApi } from '@/services/dealers.service';
import { settingsService } from '@/services/settings.service';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { exportVendorLedgerReport, exportDealerLedgerReport } from '@/utils/reportExports';
import { cn } from '@/lib/utils';

type Tab = 'vendor' | 'dealer';

function SummaryCard({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof Truck; tone: 'pay' | 'receive' }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
      <div className={cn('flex h-11 w-11 items-center justify-center rounded-lg', tone === 'pay' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success')}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}

const vendorTypeLabel: Record<string, string> = { PURCHASE: 'Purchase', RETURN: 'Return', PAYMENT: 'Payment', ADJUSTMENT: 'Adjustment' };
const dealerTypeLabel: Record<string, string> = { SALE: 'Sale', RETURN: 'Return', RECEIPT: 'Receipt', ADJUSTMENT: 'Adjustment' };

export default function LedgersPage() {
  const [tab, setTab] = useState<Tab>('vendor');
  const [vendorId, setVendorId] = useState('');
  const [dealerId, setDealerId] = useState('');
  const [payOpen, setPayOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [adjust, setAdjust] = useState<{ type: 'vendor' | 'dealer'; id: string; name: string } | null>(null);

  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: settingsService.get, retry: false });
  const currency = settings?.currency ?? 'PKR';
  const meta = { companyName: settings?.companyName || 'SRS Traders', logoUrl: settings?.companyLogo, currency };

  const { data: vendors } = useQuery({ queryKey: ['vendors'], queryFn: () => vendorsApi.list() });
  const { data: dealers } = useQuery({ queryKey: ['dealers'], queryFn: () => dealersApi.list() });

  const totalPayable = useMemo(() => (vendors ?? []).reduce((s, v) => s + v.balance, 0), [vendors]);
  const totalReceivable = useMemo(() => (dealers ?? []).reduce((s, d) => s + d.balance, 0), [dealers]);

  const vendorLedger = useQuery({
    queryKey: ['vendor-ledger', vendorId],
    queryFn: () => vendorsApi.ledger(vendorId),
    enabled: tab === 'vendor' && !!vendorId,
  });
  const dealerLedger = useQuery({
    queryKey: ['dealer-ledger', dealerId],
    queryFn: () => dealersApi.ledger(dealerId),
    enabled: tab === 'dealer' && !!dealerId,
  });

  const tabs: { id: Tab; label: string; icon: typeof Truck }[] = [
    { id: 'vendor', label: 'Vendor Ledger', icon: Truck },
    { id: 'dealer', label: 'Dealer Ledger', icon: Store },
  ];

  return (
    <div>
      <PageHeader
        title="Ledgers"
        description="Track what you owe vendors and what dealers owe you, with running balances."
        icon={<BookOpen className="h-5 w-5" />}
      />

      {/* Tabs */}
      <div className="mb-6 inline-flex flex-wrap gap-1 rounded-lg border border-border bg-muted/40 p-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = t.id === tab;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn('inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors', active ? 'bg-background text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground')}>
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Vendor Ledger ── */}
      {tab === 'vendor' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:max-w-sm">
            <SummaryCard label="Total payable (you owe vendors)" value={formatCurrency(totalPayable, currency)} icon={ArrowUpRight} tone="pay" />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className="sm:max-w-xs">
              <option value="">— Select a vendor —</option>
              {(vendors ?? []).map((v) => <option key={v.id} value={v.id}>{v.name} ({formatCurrency(v.balance, currency)})</option>)}
            </Select>
            <Button onClick={() => setPayOpen(true)} className="sm:ml-auto"><Plus className="h-4 w-4" />Record Payment</Button>
          </div>

          {!vendorId ? (
            <EmptyState icon={Truck} title="Select a vendor" description="Choose a vendor above to see their full ledger." />
          ) : vendorLedger.isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : vendorLedger.data ? (
            <div className="rounded-lg border border-border">
              <div className="flex items-center justify-between border-b border-border p-4">
                <div>
                  <p className="font-semibold">{vendorLedger.data.vendor.name}</p>
                  <p className="text-sm text-muted-foreground">Outstanding: <span className="font-bold text-foreground">{formatCurrency(vendorLedger.data.vendor.balance, currency)}</span></p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setAdjust({ type: 'vendor', id: vendorLedger.data!.vendor.id, name: vendorLedger.data!.vendor.name })}><Scale className="h-4 w-4" />Adjust</Button>
                  <Button variant="outline" size="sm" onClick={() => exportVendorLedgerReport(vendorLedger.data!, meta)}><Download className="h-4 w-4" />Export</Button>
                </div>
              </div>
              <div className="overflow-x-auto scrollbar-thin">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground">Opening balance</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(vendorLedger.data.openingBalance, currency)}</TableCell>
                    </TableRow>
                    {vendorLedger.data.entries.map((e, i) => (
                      <TableRow key={i}>
                        <TableCell className="whitespace-nowrap">{formatDate(e.date)}</TableCell>
                        <TableCell><Badge variant={e.type === 'PURCHASE' ? 'info' : e.type === 'PAYMENT' ? 'success' : 'warning'}>{vendorTypeLabel[e.type]}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{e.reference ?? '—'}</TableCell>
                        <TableCell className="text-right text-destructive">{e.amount < 0 ? formatCurrency(-e.amount, currency) : '—'}</TableCell>
                        <TableCell className="text-right text-success">{e.amount >= 0 ? formatCurrency(e.amount, currency) : '—'}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(e.balance, currency)}</TableCell>
                      </TableRow>
                    ))}
                    {vendorLedger.data.entries.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="py-6 text-center text-muted-foreground">No transactions yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ── Dealer Ledger ── */}
      {tab === 'dealer' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:max-w-sm">
            <SummaryCard label="Total receivable (dealers owe you)" value={formatCurrency(totalReceivable, currency)} icon={ArrowDownLeft} tone="receive" />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select value={dealerId} onChange={(e) => setDealerId(e.target.value)} className="sm:max-w-xs">
              <option value="">— Select a dealer —</option>
              {(dealers ?? []).map((d) => <option key={d.id} value={d.id}>{d.name} ({formatCurrency(d.balance, currency)})</option>)}
            </Select>
            <Button onClick={() => setReceiptOpen(true)} className="sm:ml-auto"><Plus className="h-4 w-4" />Record Receipt</Button>
          </div>

          {!dealerId ? (
            <EmptyState icon={Store} title="Select a dealer" description="Choose a dealer above to see their full ledger." />
          ) : dealerLedger.isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : dealerLedger.data ? (
            <div className="rounded-lg border border-border">
              <div className="flex items-center justify-between border-b border-border p-4">
                <div>
                  <p className="font-semibold">{dealerLedger.data.dealer.name}</p>
                  <p className="text-sm text-muted-foreground">Outstanding: <span className="font-bold text-foreground">{formatCurrency(dealerLedger.data.dealer.balance, currency)}</span></p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setAdjust({ type: 'dealer', id: dealerLedger.data!.dealer.id, name: dealerLedger.data!.dealer.name })}><Scale className="h-4 w-4" />Adjust</Button>
                  <Button variant="outline" size="sm" onClick={() => exportDealerLedgerReport(dealerLedger.data!, meta)}><Download className="h-4 w-4" />Export</Button>
                </div>
              </div>
              <div className="overflow-x-auto scrollbar-thin">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground">Opening balance</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(dealerLedger.data.openingBalance, currency)}</TableCell>
                    </TableRow>
                    {dealerLedger.data.entries.map((e, i) => (
                      <TableRow key={i}>
                        <TableCell className="whitespace-nowrap">{formatDate(e.date)}</TableCell>
                        <TableCell><Badge variant={e.type === 'SALE' ? 'info' : e.type === 'RECEIPT' ? 'success' : 'warning'}>{dealerTypeLabel[e.type]}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{e.reference ?? '—'}</TableCell>
                        <TableCell className="text-right text-destructive">{e.amount >= 0 ? formatCurrency(e.amount, currency) : '—'}</TableCell>
                        <TableCell className="text-right text-success">{e.amount < 0 ? formatCurrency(-e.amount, currency) : '—'}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(e.balance, currency)}</TableCell>
                      </TableRow>
                    ))}
                    {dealerLedger.data.entries.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="py-6 text-center text-muted-foreground">No transactions yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}
        </div>
      )}

      <PaymentFormDialog open={payOpen} onOpenChange={setPayOpen} mode="VENDOR_PAYMENT" presetPartyId={vendorId || undefined} />
      <PaymentFormDialog open={receiptOpen} onOpenChange={setReceiptOpen} mode="DEALER_RECEIPT" presetPartyId={dealerId || undefined} />
      <AdjustBalanceDialog target={adjust} onClose={() => setAdjust(null)} />
    </div>
  );
}
