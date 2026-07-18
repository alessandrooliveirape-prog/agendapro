import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { History, CheckCircle, XCircle, Clock, CreditCard } from 'lucide-react';

interface AppointmentPayment {
  id: string;
  client_name: string;
  service_name: string;
  date: string;
  price: number;
  payment_method: string;
  created_at: string;
}

interface MPPayment {
  id: number;
  status: string;
  status_detail: string;
  amount: number;
  description: string;
  date: string;
  payment_method: string;
}

interface PaymentHistory {
  subscription: {
    plan: string;
    expires_at: string;
  };
  appointment_payments: AppointmentPayment[];
  mercadopago_payments: MPPayment[];
}

const statusColors: Record<string, string> = {
  approved: 'text-green-400',
  pending: 'text-yellow-400',
  rejected: 'text-red-400',
  cancelled: 'text-gray-400',
  refunded: 'text-orange-400',
};

const statusLabels: Record<string, string> = {
  approved: 'Aprovado',
  pending: 'Pendente',
  rejected: 'Rejeitado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
};

export default function PaymentHistoryPage() {
  const [history, setHistory] = useState<PaymentHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'appointments' | 'subscription'>('all');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await api.request<PaymentHistory>('/payments/history');
      setHistory(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Histórico de Pagamentos</h1>
        <p className="text-gray-400">Todas as transações do seu negócio</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setTab('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'all' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setTab('appointments')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'appointments' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Agendamentos
        </button>
        <button
          onClick={() => setTab('subscription')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'subscription' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Assinatura
        </button>
      </div>

      {/* Assinatura Atual */}
      {tab === 'subscription' && history?.subscription && (
        <div className="glass rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Assinatura Atual</h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <CreditCard size={24} className="text-indigo-400" />
            </div>
            <div>
              <div className="font-medium">Plano {history.subscription.plan}</div>
              <div className="text-gray-400 text-sm">
                {history.subscription.expires_at
                  ? `Expira em ${new Date(history.subscription.expires_at).toLocaleDateString('pt-BR')}`
                  : 'Acesso ilimitado'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pagamentos de Agendamentos */}
      {(tab === 'all' || tab === 'appointments') && (
        <div className="glass rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            Pagamentos de Agendamentos ({history?.appointment_payments?.length || 0})
          </h2>
          {!history?.appointment_payments?.length ? (
            <p className="text-gray-500 text-center py-8">Nenhum pagamento de agendamento</p>
          ) : (
            <div className="space-y-3">
              {history.appointment_payments.map(apt => (
                <div key={apt.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle size={20} className="text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{apt.client_name}</div>
                    <div className="text-gray-400 text-sm">{apt.service_name} • {apt.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-400">R$ {apt.price}</div>
                    <div className="text-gray-500 text-xs">{apt.payment_method}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pagamentos Mercado Pago */}
      {(tab === 'all' || tab === 'subscription') && history?.mercadopago_payments?.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">
            Transações Mercado Pago ({history.mercadopago_payments.length})
          </h2>
          <div className="space-y-3">
            {history.mercadopago_payments.map(payment => (
              <div key={payment.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <CreditCard size={20} className="text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{payment.description || 'Pagamento'}</div>
                  <div className="text-gray-400 text-sm">
                    {new Date(payment.date).toLocaleDateString('pt-BR')} • {payment.payment_method}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">R$ {payment.amount}</div>
                  <div className={`text-xs ${statusColors[payment.status] || 'text-gray-400'}`}>
                    {statusLabels[payment.status] || payment.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-400">
            R$ {(history?.appointment_payments?.reduce((sum, p) => sum + p.price, 0) || 0).toLocaleString('pt-BR')}
          </div>
          <div className="text-gray-400 text-sm">Receita Agendamentos</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">
            R$ {(history?.mercadopago_payments?.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.amount, 0) || 0).toLocaleString('pt-BR')}
          </div>
          <div className="text-gray-400 text-sm">Receita Mercado Pago</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold gradient-text">
            R$ {(
              (history?.appointment_payments?.reduce((sum, p) => sum + p.price, 0) || 0) +
              (history?.mercadopago_payments?.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.amount, 0) || 0)
            ).toLocaleString('pt-BR')}
          </div>
          <div className="text-gray-400 text-sm">Total Geral</div>
        </div>
      </div>
    </div>
  );
}
