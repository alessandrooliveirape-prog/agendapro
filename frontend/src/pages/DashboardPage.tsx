import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Calendar, Users, DollarSign, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import OnboardingModal from '../components/OnboardingModal';

interface DashboardData {
  today: number;
  thisWeek: number;
  monthRevenue: number;
  totalClients: number;
}

interface Appointment {
  id: string;
  client_name: string;
  service_name: string;
  time: string;
  end_time: string;
  status: string;
  price: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dashboardData, appointments] = await Promise.all([
        api.getDashboard(),
        api.getAppointments({ date: new Date().toISOString().split('T')[0] }),
      ]);
      setStats(dashboardData);
      setTodayAppointments(appointments);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'badge-pending',
    confirmed: 'badge-confirmed',
    completed: 'badge-completed',
    cancelled: 'badge-cancelled',
    no_show: 'badge-no_show',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    completed: 'Concluído',
    cancelled: 'Cancelado',
    no_show: 'Não compareceu',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <OnboardingModal />
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Bom dia! 👋</h1>
        <p className="text-gray-400">
          Você tem {stats?.today || 0} agendamentos hoje.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Calendar size={20} className="text-indigo-400" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">{stats?.today || 0}</div>
          <div className="text-gray-400 text-sm">Agendamentos Hoje</div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <TrendingUp size={20} className="text-purple-400" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">{stats?.thisWeek || 0}</div>
          <div className="text-gray-400 text-sm">Esta Semana</div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <DollarSign size={20} className="text-green-400" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">
            R$ {(stats?.monthRevenue || 0).toLocaleString('pt-BR')}
          </div>
          <div className="text-gray-400 text-sm">Receita Mensal</div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Users size={20} className="text-orange-400" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">{stats?.totalClients || 0}</div>
          <div className="text-gray-400 text-sm">Total de Clientes</div>
        </div>
      </div>

      {/* Today's Appointments */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-6">Agenda de Hoje</h2>

        {todayAppointments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Calendar size={48} className="mx-auto mb-4 opacity-50" />
            <p>Nenhum agendamento para hoje</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayAppointments.map((apt) => (
              <div
                key={apt.id}
                className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/8 transition-colors"
              >
                <div className="text-sm text-gray-400 w-20 font-mono">
                  {apt.time?.slice(0, 5)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{apt.client_name}</div>
                  <div className="text-gray-400 text-sm truncate">
                    {apt.service_name} — {apt.end_time ? `${apt.time?.slice(0, 5)}-${apt.end_time?.slice(0, 5)}` : ''}
                  </div>
                </div>
                <div className="text-sm font-medium text-green-400">
                  R$ {apt.price}
                </div>
                <span className={`badge ${statusColors[apt.status] || 'badge-pending'}`}>
                  {statusLabels[apt.status] || apt.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
