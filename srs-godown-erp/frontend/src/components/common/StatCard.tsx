import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'info';

const toneStyles: Record<Tone, { icon: string; ring: string }> = {
  primary: { icon: 'bg-primary/10 text-primary', ring: 'group-hover:ring-primary/20' },
  success: { icon: 'bg-success/12 text-success', ring: 'group-hover:ring-success/20' },
  warning: { icon: 'bg-warning/12 text-warning', ring: 'group-hover:ring-warning/20' },
  danger: { icon: 'bg-destructive/12 text-destructive', ring: 'group-hover:ring-destructive/20' },
  info: { icon: 'bg-info/12 text-info', ring: 'group-hover:ring-info/20' },
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: Tone;
  delta?: { value: string; direction: 'up' | 'down' };
  hint?: string;
}

export function StatCard({ label, value, icon: Icon, tone = 'primary', delta, hint }: StatCardProps) {
  const styles = toneStyles[tone];
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
      <Card className={cn('group p-5 ring-1 ring-transparent transition-shadow hover:shadow-soft-lg', styles.ring)}>
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          </div>
          <div className={cn('flex h-11 w-11 items-center justify-center rounded-lg', styles.icon)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {(delta || hint) && (
          <div className="mt-4 flex items-center gap-2 text-xs">
            {delta && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 font-semibold',
                  delta.direction === 'up' ? 'text-success' : 'text-destructive',
                )}
              >
                {delta.direction === 'up' ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                {delta.value}
              </span>
            )}
            {hint && <span className="text-muted-foreground">{hint}</span>}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
