import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis,
} from 'recharts';
import {
  AlertTriangle, ArrowRight, Boxes, LayoutDashboard, Package, PackageX, Plus,
  ReceiptText, ShoppingCart, TrendingDown, TrendingUp, Wallet, FileSpreadsheet, PieChart,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardApi } from '@/services/dashboard.service';
import { settingsService } from '@/services/settings.service';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { cn } from '@/lib/utils';

const quickActions = [
  { label: 'Add Product', icon: Plus, to: '/products' },
  { label: 'Purchase', icon: ShoppingCart, to: '/purchases' },
  { label: 'New Sale', icon: ReceiptText, to: '/sales' },
  { label: 'Reports', icon: FileSpreadsheet, to: '/reports' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: settingsService.get, retry: false });
  const currency = settings?.currency ?? 'PKR';
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.stats });

  const money = (v?: number) => formatCurrency(v ?? 0, currency);

  const operationalCards = data ? [
    { label: 'Total Products', value: String(data.totalProducts), icon: Package, tone: 'primary' as const, hint: 'In catalogue' },
    { label: 'Total Stock', value: String(data.totalStock), icon: Boxes, tone: 'info' as const, hint: 'Units in godown' },
    { label: "Today's Sales", value: money(data.todaySales), icon: ReceiptText, tone: 'success' as const, hint: `${data.todaySalesCount} invoice(s)` },
    { label: 'Monthly Sales', value: money(data.monthSales), icon: TrendingUp, tone: 'success' as const, hint: 'This month' },
    { label: 'Low Stock', value: String(data.lowStock), icon: AlertTriangle, tone: 'warning' as const, hint: 'At/below minimum' },
    { label: 'Out Of Stock', value: String(data.outOfStock), icon: PackageX, tone: 'danger' as const, hint: 'Needs restock' },
  ] : [];

  const adminCards = data?.admin ? [
    { label: 'Receivable', value: money(data.receivable), icon: Wallet, tone: 'warning' as const, hint: 'Dealers owe you' },
    { label: 'Payable', value: money(data.payable), icon: ShoppingCart, tone: 'info' as const, hint: 'You owe vendors' },
  ] : [];

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Live overview of your warehouse."
        icon={<LayoutDashboard className="h-5 w-5" />}
      />

      {isLoading || !data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...operationalCards, ...adminCards].map((s) => <StatCard key={s.label} {...s} />)}
          </div>

          {/* Admin financial banner */}
          {data.admin && (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-border bg-card p-4"><p className="text-sm text-muted-foreground">Purchases (month)</p><p className="mt-1 text-lg font-bold">{money(data.monthPurchases)}</p></div>
              <div className="rounded-lg border border-border bg-card p-4"><p className="text-sm text-muted-foreground">Expenses (month)</p><p className="mt-1 text-lg font-bold">{money(data.monthExpenses)}</p></div>
              <div className="rounded-lg border border-border bg-card p-4"><p className="text-sm text-muted-foreground">Salaries (month)</p><p className="mt-1 text-lg font-bold">{money(data.monthSalaries)}</p></div>
              <div className={cn('rounded-lg border p-4', (data.netProfitMonth ?? 0) >= 0 ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5')}>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">{(data.netProfitMonth ?? 0) >= 0 ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />} Net Profit (month)</p>
                <p className={cn('mt-1 text-lg font-bold', (data.netProfitMonth ?? 0) >= 0 ? 'text-success' : 'text-destructive')}>{money(data.netProfitMonth)}</p>
              </div>
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Sales trend */}
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-base">Sales — last 7 days</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.salesTrend} margin={{ left: -12, right: 8, top: 8 }}>
                      <defs>
                        <linearGradient id="sales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <RechartsTooltip formatter={(v: number) => money(v)} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                      <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#sales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Quick actions + activity */}
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Quick actions</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  {quickActions.map((a) => (
                    <Button key={a.label} variant="outline" className="justify-start" onClick={() => navigate(a.to)}>
                      <a.icon className="h-4 w-4" />{a.label}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {data.admin && (
                <Card>
                  <CardHeader className="flex-row items-center justify-between">
                    <CardTitle className="text-base">Pending to collect</CardTitle>
                    <PieChart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-warning">{money(data.pendingReceivable)}</p>
                    <Button variant="ghost" size="sm" className="mt-1 px-0 text-primary" onClick={() => navigate('/pending-ledger')}>
                      View pending ledger <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Recent sales (admin) */}
          {data.admin && data.recentSales && data.recentSales.length > 0 && (
            <Card className="mt-6">
              <CardHeader><CardTitle className="text-base">Recent sales</CardTitle></CardHeader>
              <CardContent>
                <div className="divide-y divide-border">
                  {data.recentSales.map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 text-sm">
                      <div>
                        <span className="font-medium">{r.no}</span>
                        <span className="ml-2 text-muted-foreground">{r.party}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">{formatDate(r.date)}</span>
                        <span className="font-semibold">{money(r.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
