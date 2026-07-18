import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { DollarSign, CreditCard, CheckCircle, Clock, Send, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

interface Appointment {
  id: string;
  client_name: string;
  client_phone: string;
  service_name: string;
  date: string;
  time: string;
  price: number;
  payment_status: string;
  payment_method: string;
  status: string;
  notes: string;
}

export default function PaymentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');

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
          description: 'Pagamento via PIX'
        }),
      });
      toast.success('Pagamento registrado!');
      loadAppointments();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const sendPaymentLink = async (phone: string, amount: number, service: string) => {
    const message = `Olá! Você tem um pagamento pendente de R$${amount} pelo serviço: ${service}. PIX: agendapro@email.com. Confirme o pagamento respondendo este mensagem.`;
    try {
      await api.request('/payments/send-link', {
        method: 'POST',
        body: JSON.stringify({ phone, message }),
      });
      toast.success('Mensagem enviada!');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filtered = appointments.filter(a => {
    if (filter === 'pending') return a.payment_status === 'pending' && a.status !== 'cancelled';
    if (filter === 'paid') return a.payment_status === 'paid';
    return a.status !== 'cancelled';
  });

  const unpaidTotal = appointments
    .filter(a => a.payment_status === 'pending' && a.status !== 'cancelled')
    .reduce((sum, a) => sum + a.price, 0);

  const paidTotal = appointments
    .filter(a => a.payment_status === 'paid')
    .reduce((sum, a) => sum + a.price, 0);

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
          <div className="text-2xl font-bold mb-1">R$ {unpaidTotal.toLocaleString('pt-BR')}</div>
          <div className="text-gray-400 text-sm">Pendente</div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <CheckCircle size={20} className="text-green-400" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">R$ {paidTotal.toLocaleString('pt-BR')}</div>
          <div className="text-gray-400 text-sm">Recebido</div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <DollarSign size={20} className="text-indigo-400" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">R$ {(unpaidTotal + paidTotal).toLocaleString('pt-BR')}</div>
          <div className="text-gray-400 text-sm">Total Geral</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'all' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          Pendentes
        </button>
        <button
          onClick={() => setFilter('paid')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'paid' ? 'bg-green-500/20 text-green-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          Pagos
        </button>
      </div>

      {/* Lista */}
      <div className="glass rounded-2xl p-6">
        {filtered.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nenhum pagamento encontrado</p>
        ) : (
          <div className="space-y-3">
            {filtered.map(apt => (
              <div key={apt.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-white/5 rounded-xl">
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{
                  backgroundColor: apt.payment_status === 'paid' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)'
                }}>
                  {apt.payment_status === 'paid' ? (
                    <CheckCircle size={24} className="text-green-400" />
                  ) : (
                    <Clock size={24} className="text-yellow-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-medium">{apt.client_name}</div>
                  <div className="text-gray-400 text-sm">{apt.service_name} • {apt.date} {apt.time}</div>
                </div>

                <div className="text-xl font-bold" style={{
                  color: apt.payment_status === 'paid' ? '#22c55e' : '#eab308'
                }}>
                  R$ {apt.price}
                </div>

                <div className="flex gap-2">
                  {apt.payment_status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handlePayment(apt.id, apt.price)}
                        className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/30 transition flex items-center gap-2"
                      >
                        <CreditCard size={16} />
                        Confirmar
                      </button>
                      <button
                        onClick={() => sendPaymentLink(apt.client_phone, apt.price, apt.service_name)}
                        className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-500/30 transition flex items-center gap-2"
                      >
                        <Send size={16} />
                        Cobrar
                      </button>
                    </>
                  ) : (
                    <span className="px-4 py-2 bg-green-500/10 text-green-400 rounded-lg text-sm">
                      Pago
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info PIX */}
      <div className="mt-6 glass rounded-2xl p-6">
        <h3 className="font-semibold mb-3">Como funciona o pagamento</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-400">
          <div className="flex items-start gap-3">
            <span className="text-purple-400">1.</span>
            <span>Cliente agenda e vê o valor total</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-purple-400">2.</span>
            <span>Clique em "Cobrar" para enviar mensagem com dados do PIX</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-purple-400">3.</span>
            <span>Após confirmação, clique em "Confirmar" para marcar como pago</span>
          </div>
        </div>
      </div>
    </div>
  );
}
