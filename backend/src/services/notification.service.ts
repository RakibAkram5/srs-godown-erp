import { prisma } from '@/config/prisma';

export type NotificationType = 'OUT_OF_STOCK' | 'LOW_STOCK' | 'PENDING_SALE' | 'RECEIVABLE' | 'PAYABLE';
export type NotificationSeverity = 'critical' | 'warning' | 'info';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  link: string;
  amount?: number;
}

const LIST_LIMIT = 5;

export const notificationService = {
  async list(role: string, permissions: string[]): Promise<NotificationItem[]> {
    const isAdmin = role === 'ADMIN';
    const can = (mod: string) => isAdmin || permissions.includes(mod);
    const notifications: NotificationItem[] = [];

    if (can('products')) {
      const products = await prisma.product.findMany({
        where: { isDeleted: false, isActive: true },
        select: { id: true, name: true, currentStock: true, minimumStock: true },
      });

      for (const p of products.filter((p) => p.currentStock <= 0).slice(0, LIST_LIMIT)) {
        notifications.push({
          id: `oos-${p.id}`,
          type: 'OUT_OF_STOCK',
          title: 'Out of stock',
          message: `${p.name} has 0 units left`,
          severity: 'critical',
          link: '/products',
        });
      }

      for (const p of products
        .filter((p) => p.currentStock > 0 && p.minimumStock > 0 && p.currentStock <= p.minimumStock)
        .slice(0, LIST_LIMIT)) {
        notifications.push({
          id: `low-${p.id}`,
          type: 'LOW_STOCK',
          title: 'Low stock',
          message: `${p.name} is down to ${p.currentStock} (min ${p.minimumStock})`,
          severity: 'warning',
          link: '/products',
        });
      }
    }

    if (can('sales')) {
      const pendingItems = await prisma.saleItem.findMany({
        where: { pendingQuantity: { gt: 0 }, sale: { status: 'COMPLETED' } },
        include: {
          sale: { select: { saleNo: true, customerName: true, dealer: { select: { name: true } } } },
        },
        orderBy: { sale: { saleDate: 'asc' } },
        take: LIST_LIMIT,
      });

      for (const item of pendingItems) {
        const party = item.sale.dealer?.name ?? item.sale.customerName ?? 'Walk-in';
        notifications.push({
          id: `pending-${item.id}`,
          type: 'PENDING_SALE',
          title: 'Pending delivery',
          message: `${item.pendingQuantity} × ${item.productName} owed to ${party} (${item.sale.saleNo})`,
          severity: 'info',
          link: '/sales',
        });
      }
    }

    if (isAdmin) {
      const [dealers, vendors] = await Promise.all([
        prisma.dealer.findMany({
          where: { isDeleted: false, balance: { gt: 0 } },
          orderBy: { balance: 'desc' },
          take: LIST_LIMIT,
          select: { id: true, name: true, balance: true },
        }),
        prisma.vendor.findMany({
          where: { isDeleted: false, balance: { gt: 0 } },
          orderBy: { balance: 'desc' },
          take: LIST_LIMIT,
          select: { id: true, name: true, balance: true },
        }),
      ]);

      for (const d of dealers) {
        notifications.push({
          id: `recv-${d.id}`,
          type: 'RECEIVABLE',
          title: 'Payment due',
          message: `${d.name} owes you`,
          severity: 'warning',
          link: '/ledgers',
          amount: d.balance,
        });
      }

      for (const v of vendors) {
        notifications.push({
          id: `pay-${v.id}`,
          type: 'PAYABLE',
          title: 'Vendor balance',
          message: `You owe ${v.name}`,
          severity: 'info',
          link: '/ledgers',
          amount: v.balance,
        });
      }
    }

    return notifications;
  },
};
