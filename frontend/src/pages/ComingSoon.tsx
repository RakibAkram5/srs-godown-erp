import type { LucideIcon } from 'lucide-react';
import { Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/ui/badge';

interface ComingSoonProps {
  title: string;
  description: string;
  icon: LucideIcon;
  note?: string;
}

export function ComingSoon({ title, description, icon: Icon, note }: ComingSoonProps) {
  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        icon={<Icon className="h-5 w-5" />}
        actions={
          <Badge variant="info" className="gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            Coming soon
          </Badge>
        }
      />
      <EmptyState
        icon={Icon}
        title={`${title} is on the way`}
        description={
          note ??
          'This module arrives in a later phase. The foundation is ready, so building it out will be quick.'
        }
      />
    </div>
  );
}
