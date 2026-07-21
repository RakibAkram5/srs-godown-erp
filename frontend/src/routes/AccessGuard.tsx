import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  children: ReactNode;
  module?: string;
  adminOnly?: boolean;
}

/**
 * Guards a route by role/permission. Admin always passes. Non-admins are
 * redirected to the dashboard if they lack the module permission or the
 * route is admin-only. Prevents access via direct URL, not just hidden menus.
 */
export function AccessGuard({ children, module, adminOnly }: Props) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const allowed =
    user.role === 'ADMIN' ||
    (adminOnly ? false : module ? (user.permissions ?? []).includes(module) : true);
  if (!allowed) return <Navigate to="/" replace />;
  return <>{children}</>;
}
