import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
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
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));

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
            <Route path="masters" element={<MastersPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="purchases" element={<PurchasesPage />} />
            <Route path="sales" element={<SalesPage />} />
            <Route path="dealers" element={<DealersPage />} />
            <Route path="vendors" element={<VendorsPage />} />
            <Route path="ledgers" element={<LedgersPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
