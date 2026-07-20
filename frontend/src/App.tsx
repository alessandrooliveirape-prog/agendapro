import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AgendaPage from './pages/AgendaPage';
import ServicesPage from './pages/ServicesPage';
import ProfessionalsPage from './pages/ProfessionalsPage';
import ClientsPage from './pages/ClientsPage';
import SettingsPage from './pages/SettingsPage';
import ReportsPage from './pages/ReportsPage';
import PaymentsPage from './pages/PaymentsPage';
import RecurringPage from './pages/RecurringPage';
import PricingPage from './pages/PricingPage';
import PaymentHistoryPage from './pages/PaymentHistoryPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import BookingPage from './pages/BookingPage';
import UnitsPage from './pages/UnitsPage';
import { Component, type ReactNode } from 'react';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Algo deu errado</h1>
            <p className="text-gray-400 mb-4">Ocorreu um erro inesperado.</p>
            <button onClick={() => window.location.reload()} className="btn btn-primary">
              Recarregar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to="/" />;
  return <>{children}</>;
}

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-700 mb-4">404</h1>
        <p className="text-gray-400 mb-6">Página não encontrada</p>
        <a href="/" className="btn btn-primary">Voltar ao início</a>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Carregando...</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/agendar/:slug" element={<BookingPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="agenda" element={<AgendaPage />} />
        <Route path="servicos" element={<ServicesPage />} />
        <Route path="profissionais" element={<ProfessionalsPage />} />
        <Route path="clientes" element={<ClientsPage />} />
        <Route path="configuracoes" element={<SettingsPage />} />
        <Route path="relatorios" element={<ReportsPage />} />
        <Route path="pagamentos" element={<PaymentsPage />} />
        <Route path="recorrentes" element={<RecurringPage />} />
        <Route path="unidades" element={<UnitsPage />} />
        <Route path="planos" element={<PricingPage />} />
        <Route path="historico-pagamentos" element={<PaymentHistoryPage />} />
        <Route path="admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <SubscriptionProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#1f2937',
                  color: '#fff',
                  borderRadius: '12px',
                },
              }}
            />
            <AppRoutes />
          </SubscriptionProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
