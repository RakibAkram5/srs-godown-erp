import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { AccessGuard } from './AccessGuard';
import { LoadingScreen } from '@/components/common/LoadingScreen';

const LoginPage = lazy(() => import('@/pages/LoginPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const MastersPage = lazy(() => import('@/pages/MastersPage'));
const ProductsPage = lazy(() => import('@/pages/ProductsPage'));
const PurchasesPage = lazy(() => import('@/pages/PurchasesPage'));
const SalesPage = lazy(() => import('@/pages/SalesPage'));
const DealersPage = lazy(() => import('@/pages/DealersPage'));
const VendorsPage = lazy(() => import('@/pages/VendorsPage'));
const LedgersPage = lazy(() => import('@/pages/LedgersPage'));
const DispatchPage = lazy(() => import('@/pages/DispatchPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const UsersPage = lazy(() => import('@/pages/UsersPage'));

const NotFoundPage = lazy(() => import('@/pages/errors/NotFoundPage'));
const ServerErrorPage = lazy(() => import('@/pages/errors/ServerErrorPage'));
const NoInternetPage = lazy(() => import('@/pages/errors/NoInternetPage'));
const UnauthorizedPage = lazy(() => import('@/pages/errors/UnauthorizedPage'));

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Standalone error routes */}
        <Route path="/500" element={<ServerErrorPage />} />
        <Route path="/no-internet" element={<NoInternetPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Protected app shell */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="masters" element={<AccessGuard module="masters"><MastersPage /></AccessGuard>} />
            <Route path="products" element={<AccessGuard module="products"><ProductsPage /></AccessGuard>} />
            <Route path="purchases" element={<AccessGuard module="purchases"><PurchasesPage /></AccessGuard>} />
            <Route path="sales" element={<AccessGuard module="sales"><SalesPage /></AccessGuard>} />
            <Route path="dispatch" element={<AccessGuard module="dispatch"><DispatchPage /></AccessGuard>} />
            <Route path="dealers" element={<AccessGuard module="dealers"><DealersPage /></AccessGuard>} />
            <Route path="vendors" element={<AccessGuard module="vendors"><VendorsPage /></AccessGuard>} />
            <Route path="ledgers" element={<AccessGuard adminOnly><LedgersPage /></AccessGuard>} />
            <Route path="reports" element={<AccessGuard adminOnly><ReportsPage /></AccessGuard>} />
            <Route path="users" element={<AccessGuard adminOnly><UsersPage /></AccessGuard>} />
            <Route path="settings" element={<AccessGuard adminOnly><SettingsPage /></AccessGuard>} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
