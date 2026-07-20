import {
  LayoutDashboard,
  Boxes,
  Package,
  ShoppingCart,
  ReceiptText,
  Store,
  Truck,
  BookOpen,
  BarChart3,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  title: string;
  path: string;
  icon: LucideIcon;
  /** Marks modules that arrive in a later phase. */
  comingSoon?: boolean;
}

export const navItems: NavItem[] = [
  { title: 'Dashboard', path: '/', icon: LayoutDashboard },
  { title: 'Masters', path: '/masters', icon: Boxes },
  { title: 'Products', path: '/products', icon: Package },
  { title: 'Purchases', path: '/purchases', icon: ShoppingCart, comingSoon: true },
  { title: 'Sales', path: '/sales', icon: ReceiptText, comingSoon: true },
  { title: 'Dealers', path: '/dealers', icon: Store, comingSoon: true },
  { title: 'Vendors', path: '/vendors', icon: Truck, comingSoon: true },
  { title: 'Ledgers', path: '/ledgers', icon: BookOpen, comingSoon: true },
  { title: 'Reports', path: '/reports', icon: BarChart3, comingSoon: true },
  { title: 'Settings', path: '/settings', icon: Settings },
];

/** Look up a nav item's title from a path segment for breadcrumbs. */
export function titleForSegment(segment: string): string {
  const match = navItems.find((i) => i.path === `/${segment}`);
  if (match) return match.title;
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}
