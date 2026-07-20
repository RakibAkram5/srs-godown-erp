import { useState } from 'react';
import { CalendarDays, Menu } from 'lucide-react';
import { SearchBar } from '@/components/common/SearchBar';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { NotificationsMenu } from './NotificationsMenu';
import { ProfileMenu } from './ProfileMenu';
import { formatDate } from '@/utils/formatters';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  onOpenMobileSidebar: () => void;
}

export function Header({ onOpenMobileSidebar }: HeaderProps) {
  const [query, setQuery] = useState('');
  const { user } = useAuth();
  const today = formatDate(new Date(), { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
      {/* Mobile sidebar trigger */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenMobileSidebar}
        aria-label="Open menu"
      >
        <Menu />
      </Button>

      {/* Global search */}
      <div className="hidden max-w-md flex-1 sm:block">
        <SearchBar value={query} onChange={setQuery} placeholder="Search products, orders, dealers…" />
      </div>

      <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-2">
        {/* Current date */}
        <div className="mr-1 hidden items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm font-medium text-muted-foreground xl:flex">
          <CalendarDays className="h-4 w-4" />
          {today}
        </div>

        <ThemeToggle />
        <NotificationsMenu />
        <div className="ml-1 flex items-center gap-2.5">
          <span className="hidden text-right text-sm font-semibold leading-tight sm:block">
            {user?.name}
            <span className="block text-xs font-normal text-muted-foreground">{user?.role}</span>
          </span>
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
