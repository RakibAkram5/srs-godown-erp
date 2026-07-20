import type { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  code?: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone?: 'primary' | 'warning' | 'danger';
  primaryAction?: { label: string; onClick: () => void };
}

const toneMap = {
  primary: 'bg-primary/10 text-primary',
  warning: 'bg-warning/12 text-warning',
  danger: 'bg-destructive/12 text-destructive',
};

export function ErrorState({
  code,
  title,
  description,
  icon: Icon,
  tone = 'primary',
  primaryAction,
}: ErrorStateProps) {
  const navigate = useNavigate();
  const action = primaryAction ?? { label: 'Back to Dashboard', onClick: () => navigate('/') };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md text-center"
      >
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${toneMap[tone]}`}>
          <Icon className="h-8 w-8" />
        </div>
        {code && <p className="mt-6 text-5xl font-bold tracking-tight text-foreground">{code}</p>}
        <h1 className="mt-2 text-xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={action.onClick}>{action.label}</Button>
        </div>
      </motion.div>
    </div>
  );
}
