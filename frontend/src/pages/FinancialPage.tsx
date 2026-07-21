import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, PieChart, TrendingDown, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { reportsApi } from '@/services/reports.service';
import { settingsService } from '@/services/settings.service';
import { exportFinancialReport } from '@/utils/reportExports';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { cn } from '@/lib/utils';

type Mode = 'annual' | 'quarterly' | 'custom';

function lastDayOfMonth(year: number, monthIndex: number): string {
  const d = new Date(year, monthIndex + 1, 0);
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function FinancialPage() {
  const now = new Date();
  const [mode, setMode] = useState<Mode>('annual');
  const [year, setYear] = useState(now.getFullYear());
  const [quarter, setQuarter] = useState(Math.floor(now.getMonth() / 3) + 1);
  const [from, setFrom] = useState(`${now.getFullYear()}-01-01`);
  const [to, setTo] = useState(now.toISOString().slice(0, 10));

  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: settingsService.get, retry: false });
  const currency = settings?.currency ?? 'PKR';
  const meta = { companyName: settings?.companyName || 'SRS Traders', logoUrl: settings?.companyLogo, currency };

  const period = useMemo(() => {
    if (mode === 'custom') return { from, to };
    if (mode === 'quarterly') {
      const startMonth = (quarter - 1) * 3;
      return { from: `${year}-${String(startMonth + 1).padStart(2, '0')}-01`, to: lastDayOfMonth(year, startMonth + 2) };
    }
    return { from: `${year}-01-01`, to: `${year}-12-31` };
  }, [mode, year, quarter, from, to]);

  const { data, isLoading } = useQuery({
    queryKey: ['financial', period],
    queryFn: () => reportsApi.financial(period.from, period.to),
  });

  const years = useMemo(() => Array.from({ length: 6 }, (_, i) => now.getFullYear() - i), [now]);

  const cards = data ? [
    { label: 'Sales (income)', value: data.sales.total, tone: 'income' as const },
    { label: 'Purchases (cost)', value: data.purchases.total, tone: 'cost' as const },
    { label: 'Expenses', value: data.expenses.total, tone: 'cost' as const },
    { label: 'Salaries', value: data.salaries.total, tone: 'cost' as const },
  ] : [];

  return (
    <div>
      <PageHeader
        title="Financial Reports"
        description="Profit & Loss for any period — annual, quarterly or custom."
        icon={<PieChart className="h-5 w-5" />}
        actions={data && <Button variant="outline" onClick={() => exportFinancialReport(data, meta)}><Download className="h-4 w-4" />Export</Button>}
      />

      {/* Period controls */}
      <div className="mb-6 flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <Select value={mode} onChange={(e) => setMode(e.target.value as Mode)} className="sm:w-40">
          <option value="annual">Annual</option>
          <option value="quarterly">Quarterly</option>
          <option value="custom">Custom range</option>
        </Select>
        {mode !== 'custom' && (
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="sm:w-32">
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>
        )}
        {mode === 'quarterly' && (
          <Select value={quarter} onChange={(e) => setQuarter(Number(e.target.value))} className="sm:w-40">
            <option value={1}>Q1 (Jan–Mar)</option>
            <option value={2}>Q2 (Apr–Jun)</option>
            <option value={3}>Q3 (Jul–Sep)</option>
            <option value={4}>Q4 (Oct–Dec)</option>
          </Select>
        )}
        {mode === 'custom' && (
          <>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="sm:w-40" />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="sm:w-40" />
          </>
        )}
        {data && <span className="text-sm text-muted-foreground sm:ml-auto">{formatDate(data.period.from)} — {formatDate(data.period.to)}</span>}
      </div>

      {isLoading || !data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((c) => (
              <div key={c.label} className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <p className={cn('mt-1 text-xl font-bold', c.tone === 'income' ? 'text-success' : 'text-foreground')}>{formatCurrency(c.value, currency)}</p>
              </div>
            ))}
          </div>

          {/* Net profit banner */}
          <div className={cn('flex items-center justify-between rounded-lg border p-5', data.netProfit >= 0 ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5')}>
            <div className="flex items-center gap-3">
              <div className={cn('flex h-11 w-11 items-center justify-center rounded-lg', data.netProfit >= 0 ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive')}>
                {data.netProfit >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Profit / Loss</p>
                <p className="text-xs text-muted-foreground">Sales − Purchases − Expenses − Salaries</p>
              </div>
            </div>
            <p className={cn('text-2xl font-bold', data.netProfit >= 0 ? 'text-success' : 'text-destructive')}>{formatCurrency(data.netProfit, currency)}</p>
          </div>

          {/* P&L statement */}
          <div className="rounded-lg border border-border">
            <div className="border-b border-border p-4"><p className="font-semibold">Profit &amp; Loss Statement</p></div>
            <Table>
              <TableBody>
                <TableRow><TableCell className="text-muted-foreground">Sales (income)</TableCell><TableCell className="text-right font-medium text-success">{formatCurrency(data.sales.total, currency)}</TableCell></TableRow>
                <TableRow><TableCell className="text-muted-foreground">Less: Purchases</TableCell><TableCell className="text-right">({formatCurrency(data.purchases.total, currency)})</TableCell></TableRow>
                <TableRow><TableCell className="text-muted-foreground">Less: Expenses</TableCell><TableCell className="text-right">({formatCurrency(data.expenses.total, currency)})</TableCell></TableRow>
                <TableRow><TableCell className="text-muted-foreground">Less: Salaries</TableCell><TableCell className="text-right">({formatCurrency(data.salaries.total, currency)})</TableCell></TableRow>
                <TableRow className="border-t-2 border-border"><TableCell className="font-bold">Net Profit</TableCell><TableCell className={cn('text-right font-bold', data.netProfit >= 0 ? 'text-success' : 'text-destructive')}>{formatCurrency(data.netProfit, currency)}</TableCell></TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Extra summaries */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-border p-4">
              <p className="mb-3 font-semibold">Balances &amp; pending</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Receivable (dealers owe you)</span><span className="font-medium">{formatCurrency(data.outstanding.receivable, currency)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Payable (you owe vendors)</span><span className="font-medium">{formatCurrency(data.outstanding.payable, currency)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Pending stock value</span><span className="font-medium">{formatCurrency(data.pending.value, currency)}</span></div>
              </div>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="mb-3 font-semibold">Expenses by category</p>
              {data.expenses.byCategory.length === 0 ? (
                <p className="text-sm text-muted-foreground">No expenses in this period.</p>
              ) : (
                <div className="max-h-52 space-y-2 overflow-y-auto scrollbar-thin text-sm">
                  {data.expenses.byCategory.map((c) => (
                    <div key={c.category} className="flex justify-between"><span className="text-muted-foreground">{c.category}</span><span className="font-medium">{formatCurrency(c.amount, currency)}</span></div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
