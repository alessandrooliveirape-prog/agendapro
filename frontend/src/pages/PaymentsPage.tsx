import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { DollarSign, CreditCard, CheckCircle, Clock, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Appointment {
  id: string;
  client_name: string;
  service_name: string;
  date: string;
  time: string;
  price: number;
  payment_status: string;
  payment_method: string;
  status: string;
}

export default function PaymentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const data = await api.getAppointments({});
      setAppointments(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (appointmentId: string, amount: number) => {
    try {
      await api.request('/payments/create-checkout', {
        method: 'POST',
        body: JSON.stringify({
          appointment_id: appointmentId,
          amount: amount,
          description: 'Pagamento online'
        }),
      });
      toast.success('Pagamento registrado!');
      loadAppointments();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const unpaidAppointments = appointments.filter(a => a.payment_status === 'pending' && a.status !== 'cancelled');
  const paidAppointments = appointments.filter(a => a.payment_status === 'paid');
  const totalPending = unpaidAppointments.reduce((sum, a) => sum + a.price, 0);
  const totalPaid = paidAppointments.reduce((sum, a) => sum + a.price, 0);

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
        <h1 className="text-2xl font-bold">Pagamentos</h1>
        <p className="text-gray-400">Gerencie cobranças e receitas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Clock size={20} className="text-yellow-400" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">R$ {totalPending.toLocaleString('pt-BR')}</div>
          <div className="text-gray-400 text-sm">Pendente ({unpaidAppointments.length})</div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <CheckCircle size={20} className="text-green-400" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">R$ {totalPaid.toLocaleString('pt-BR')}</div>
          <div className="text-gray-400 text-sm">Recebido ({paidAppointments.length})</div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <DollarSign size={20} className="text-indigo-400" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">R$ {(totalPaid + totalPending).toLocaleString('pt-BR')}</div>
          <div className="text-gray-400 text-sm">Total Geral</div>
        </div>
      </div>

      {/* Pagamentos Pendentes */}
      <div className="glass rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Pagamentos Pendentes</h2>
        {unpaidAppointments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nenhum pagamento pendente</p>
        ) : (
          <div className="space-y-3">
            {unpaidAppointments.map(apt => (
              <div key={apt.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                <div className="flex-1">
                  <div className="font-medium">{apt.client_name}</div>
                  <div className="text-gray-400 text-sm">{apt.service_name} • {apt.date} {apt.time}</div>
                </div>
                <div className="text-lg font-bold text-yellow-400">R$ {apt.price}</div>
                <button
                  onClick={() => handlePayment(apt.id, apt.price)}
                  className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/30 transition flex items-center gap-2"
                >
                  <CreditCard size={16} />
                  Registrar Pagamento
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Histórico */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Histórico de Pagamentos</h2>
        {paidAppointments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nenhum pagamento registrado</p>
        ) : (
          <div className="space-y-3">
            {paidAppointments.map(apt => (
              <div key={apt.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle size={20} className="text-green-400" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{apt.client_name}</div>
                  <div className="text-gray-400 text-sm">{apt.service_name} • {apt.date}</div>
                </div>
                <div className="text-lg font-bold text-green-400">R$ {apt.price}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
