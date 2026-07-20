import { useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CircleDollarSign,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  Package,
  PackageX,
  Plus,
  ReceiptText,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { timeAgo } from '@/utils/formatters';

/* ---- Placeholder data (Phase 1 is UI only) ---- */

const stats = [
  { label: 'Total Products', value: '—', icon: Package, tone: 'primary' as const, hint: 'Awaiting catalogue' },
  { label: 'Total Stock', value: '—', icon: Boxes, tone: 'info' as const, hint: 'Units in godown' },
  { label: "Today's Sales", value: '—', icon: ReceiptText, tone: 'success' as const, hint: 'Billed today' },
  { label: 'Monthly Sales', value: '—', icon: TrendingUp, tone: 'success' as const, hint: 'This month' },
  { label: 'Pending Payments', value: '—', icon: Wallet, tone: 'warning' as const, hint: 'Receivables' },
  { label: 'Low Stock', value: '—', icon: AlertTriangle, tone: 'warning' as const, hint: 'Below reorder level' },
  { label: 'Out Of Stock', value: '—', icon: PackageX, tone: 'danger' as const, hint: 'Needs restock' },
];

const salesTrend = [
  { name: 'Mon', value: 0 },
  { name: 'Tue', value: 0 },
  { name: 'Wed', value: 0 },
  { name: 'Thu', value: 0 },
  { name: 'Fri', value: 0 },
  { name: 'Sat', value: 0 },
  { name: 'Sun', value: 0 },
];

const topCategories = [
  { name: 'Engine', value: 0 },
  { name: 'Brakes', value: 0 },
  { name: 'Electrical', value: 0 },
  { name: 'Body', value: 0 },
  { name: 'Tyres', value: 0 },
];

const stockSplit = [
  { name: 'In Stock', value: 1 },
  { name: 'Low Stock', value: 0 },
  { name: 'Out of Stock', value: 0 },
];
const pieColors = ['hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

const quickActions = [
  { label: 'Add Product', icon: Plus, to: '/products' },
  { label: 'Purchase', icon: ShoppingCart, to: '/purchases' },
  { label: 'Sales', icon: ReceiptText, to: '/sales' },
  { label: 'Generate Invoice', icon: FileText, to: '/sales' },
  { label: 'Export Excel', icon: FileSpreadsheet, to: '/reports' },
];

const recentActivity = [
  { id: '1', text: 'Welcome to SRS Godown ERP', at: Date.now() - 1000 * 60 * 2 },
  { id: '2', text: 'Your workspace is ready to configure', at: Date.now() - 1000 * 60 * 60 },
  { id: '3', text: 'Add your company details in Settings', at: Date.now() - 1000 * 60 * 60 * 5 },
];

function ChartEmptyBadge() {
  return (
    <Badge variant="secondary" className="font-medium text-muted-foreground">
      Sample data
    </Badge>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Here's an overview of your warehouse. Live numbers appear once modules are enabled."
        icon={<LayoutDashboard className="h-5 w-5" />}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Sales Overview</CardTitle>
            <ChartEmptyBadge />
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={salesTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                    color: 'hsl(var(--popover-foreground))',
                    fontSize: '0.8rem',
                  }}
                />
                <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#salesFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Stock Status</CardTitle>
            <ChartEmptyBadge />
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={stockSplit}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {stockSplit.map((entry, i) => (
                    <Cell key={entry.name} fill={pieColors[i]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                    color: 'hsl(var(--popover-foreground))',
                    fontSize: '0.8rem',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap justify-center gap-4">
              {stockSplit.map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: pieColors[i] }} />
                  {entry.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories + Quick actions */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Top Categories</CardTitle>
            <ChartEmptyBadge />
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topCategories} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                    color: 'hsl(var(--popover-foreground))',
                    fontSize: '0.8rem',
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2.5">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="h-12 justify-between"
                onClick={() => navigate(action.to)}
              >
                <span className="flex items-center gap-2.5">
                  <action.icon className="h-4 w-4 text-primary" />
                  {action.label}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentActivity.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-md px-2 py-3 transition-colors hover:bg-muted/50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CircleDollarSign className="h-4 w-4" />
                </span>
                <p className="flex-1 text-sm font-medium">{item.text}</p>
                <span className="text-xs text-muted-foreground">{timeAgo(item.at)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
