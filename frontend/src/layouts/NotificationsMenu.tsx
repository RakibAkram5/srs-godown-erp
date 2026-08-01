import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell, BellOff, PackageX, PackageMinus, Truck, Wallet, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { notificationsApi, type NotificationItem, type NotificationType } from '@/services/notifications.service';
import { settingsService } from '@/services/settings.service';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/lib/utils';

const ICONS: Record<NotificationType, typeof PackageX> = {
  OUT_OF_STOCK: PackageX,
  LOW_STOCK: PackageMinus,
  PENDING_SALE: Truck,
  RECEIVABLE: Wallet,
  PAYABLE: Landmark,
};

const SEVERITY_STYLES: Record<NotificationItem['severity'], string> = {
  critical: 'bg-destructive/10 text-destructive',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  info: 'bg-primary/10 text-primary',
};

export function NotificationsMenu() {
  const navigate = useNavigate();
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: settingsService.get, retry: false });
  const currency = settings?.currency ?? 'PKR';

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.list,
    refetchInterval: 60_000,
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell />
          {notifications.length > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground ring-2 ring-background">
              {notifications.length > 9 ? '9+' : notifications.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
        </div>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <BellOff className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-medium">You're all caught up</p>
            <p className="mt-1 text-xs text-muted-foreground">
              New alerts about stock and orders will appear here.
            </p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((n) => {
              const Icon = ICONS[n.type];
              return (
                <button
                  key={n.id}
                  onClick={() => navigate(n.link)}
                  className="flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left last:border-0 hover:bg-muted/60"
                >
                  <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', SEVERITY_STYLES[n.severity])}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{n.message}</p>
                    {n.amount != null && (
                      <p className="mt-0.5 text-xs font-semibold text-foreground">{formatCurrency(n.amount, currency)}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
