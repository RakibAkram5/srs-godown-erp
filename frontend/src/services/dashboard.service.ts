import { api, unwrap } from './api';

export interface DashboardStats {
  totalProducts: number;
  totalStock: number;
  lowStock: number;
  outOfStock: number;
  todaySales: number;
  todaySalesCount: number;
  monthSales: number;
  monthSalesCount: number;
  salesTrend: { name: string; value: number }[];
  admin: boolean;
  receivable?: number;
  payable?: number;
  pendingReceivable?: number;
  monthPurchases?: number;
  monthExpenses?: number;
  monthSalaries?: number;
  netProfitMonth?: number;
  recentSales?: { no: string | null; date: string; amount: number; party: string }[];
}

export const dashboardApi = {
  stats(): Promise<DashboardStats> {
    return unwrap<DashboardStats>(api.get('/dashboard'));
  },
};
