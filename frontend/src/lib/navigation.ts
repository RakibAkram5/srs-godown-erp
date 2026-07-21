import {
  LayoutDashboard,
  Boxes,
  Package,
  ShoppingCart,
  ReceiptText,
  Send,
  Store,
  Truck,
  BookOpen,
  BarChart3,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { User } from '@/types';

export interface NavItem {
  title: string;
  path: string;
  icon: LucideIcon;
  /** Grantable module key (Manager/Employee need it in permissions). */
  module?: string;
  /** Admin-only item (financial / management). */
  adminOnly?: boolean;
  /** Marks modules that arrive in a later phase. */
  comingSoon?: boolean;
}

export const navItems: NavItem[] = [
  { title: 'Dashboard', path: '/', icon: LayoutDashboard },
  { title: 'Masters', path: '/masters', icon: Boxes, module: 'masters' },
  { title: 'Products', path: '/products', icon: Package, module: 'products' },
  { title: 'Purchases', path: '/purchases', icon: ShoppingCart, module: 'purchases' },
  { title: 'Sales', path: '/sales', icon: ReceiptText, module: 'sales' },
  { title: 'Dispatch', path: '/dispatch', icon: Send, module: 'dispatch' },
  { title: 'Dealers', path: '/dealers', icon: Store, module: 'dealers' },
  { title: 'Vendors', path: '/vendors', icon: Truck, module: 'vendors' },
  { title: 'Ledgers', path: '/ledgers', icon: BookOpen, adminOnly: true },
  { title: 'Reports', path: '/reports', icon: BarChart3, adminOnly: true },
  { title: 'Users', path: '/users', icon: Users, adminOnly: true },
  { title: 'Settings', path: '/settings', icon: Settings, adminOnly: true },
];

/** Modules an Admin can grant to a Manager/Employee. */
export const GRANTABLE_MODULES: { key: string; label: string }[] = [
  { key: 'masters', label: 'Masters' },
  { key: 'products', label: 'Products' },
  { key: 'purchases', label: 'Purchases' },
  { key: 'sales', label: 'Sales' },
  { key: 'dispatch', label: 'Dispatch' },
  { key: 'dealers', label: 'Dealers' },
  { key: 'vendors', label: 'Vendors' },
];

export function isAdmin(user: User | null): boolean {
  return user?.role === 'ADMIN';
}

/** Whether a user can access a given nav item. */
export function canAccessItem(item: NavItem, user: User | null): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  if (item.adminOnly) return false;
  if (item.module) return (user.permissions ?? []).includes(item.module);
  return true; // dashboard / profile-type routes
}

/** Whether a user can access a given path (used by route guards). */
export function canAccessPath(path: string, user: User | null): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  const item = navItems.find((i) => i.path === path);
  if (!item) return true;
  return canAccessItem(item, user);
}

export function accessibleNav(user: User | null): NavItem[] {
  return navItems.filter((i) => canAccessItem(i, user));
}

/** Look up a nav item's title from a path segment for breadcrumbs. */
export function titleForSegment(segment: string): string {
  const match = navItems.find((i) => i.path === `/${segment}`);
  if (match) return match.title;
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}
