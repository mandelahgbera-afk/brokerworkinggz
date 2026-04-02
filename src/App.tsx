import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster as Sonner } from 'sonner';
import { AuthProvider } from '@/lib/auth';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import AuthCallback from '@/pages/AuthCallback';

import Landing from '@/pages/Landing';
import AuthPage from '@/pages/Auth';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Portfolio from '@/pages/Portfolio';
import Trade from '@/pages/Trade';
import CopyTrading from '@/pages/CopyTrading';
import Transactions from '@/pages/Transactions';
import Settings from '@/pages/Settings';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import ManageUsers from '@/pages/admin/ManageUsers';
import ManageCryptos from '@/pages/admin/ManageCryptos';
import ManageTraders from '@/pages/admin/ManageTraders';
import AdminTransactions from '@/pages/admin/AdminTransactions';
import PlatformSettingsPage from '@/pages/admin/PlatformSettings';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const basePath = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter basename={basePath} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/landing" element={<Landing />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/trade" element={<Trade />} />
                <Route path="/copy-trading" element={<CopyTrading />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
              <Route element={<AdminRoute><AppLayout /></AdminRoute>}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<ManageUsers />} />
                <Route path="/admin/cryptos" element={<ManageCryptos />} />
                <Route path="/admin/traders" element={<ManageTraders />} />
                <Route path="/admin/transactions" element={<AdminTransactions />} />
                <Route path="/admin/settings" element={<PlatformSettingsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          <Sonner position="top-right" theme="dark" richColors />
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
