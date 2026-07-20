import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Status = 'active' | 'inactive' | 'pending' | 'in-stock' | 'low-stock' | 'out-of-stock';

const map: Record<Status, { label: string; variant: 'success' | 'warning' | 'danger' | 'secondary' }> = {
  active: { label: 'Active', variant: 'success' },
  inactive: { label: 'Inactive', variant: 'secondary' },
  pending: { label: 'Pending', variant: 'warning' },
  'in-stock': { label: 'In stock', variant: 'success' },
  'low-stock': { label: 'Low stock', variant: 'warning' },
  'out-of-stock': { label: 'Out of stock', variant: 'danger' },
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const { label, variant } = map[status];
  return (
    <Badge variant={variant} className={cn('gap-1.5', className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </Badge>
  );
}
