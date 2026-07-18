import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { BarChart3, TrendingUp, Users, Clock, DollarSign } from 'lucide-react';

interface DashboardData {
  today: number;
  thisWeek: number;
  monthRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  totalClients: number;
  totalServices: number;
  attendanceRate: number;
}

interface TopService {
  name: string;
  count: number;
  revenue: number;
}

interface BusyHour {
  hour: string;
  count: number;
}

interface TopClient {
  name: string;
  phone: string;
  visits: number;
  spent: number;
}

export default function ReportsPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [topServices, setTopServices] = useState<TopService[]>([]);
  const [busyHours, setBusyHours] = useState<BusyHour[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const [dashData, revenueData, hoursData, clientsData] = await Promise.all([
        api.request<any>('/reports/dashboard'),
        api.request<any>('/reports/revenue'),
        api.request<any>('/reports/busy-hours'),
        api.request<any>('/reports/top-clients'),
      ]);
      setDashboard(dashData);
      setTopServices(revenueData.topServices || []);
      setBusyHours(hoursData.busyHours || []);
      setTopClients(clientsData.topClients || []);
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
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <p className="text-gray-400">Análise completa do seu negócio</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <DollarSign size={20} className="text-green-400" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">R$ {(dashboard?.monthRevenue || 0).toLocaleString('pt-BR')}</div>
          <div className="text-gray-400 text-sm">Receita Mensal</div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <BarChart3 size={20} className="text-indigo-400" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">{dashboard?.thisWeek || 0}</div>
          <div className="text-gray-400 text-sm">Agendamentos Semana</div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
              <Users size={20} className="text-pink-400" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">{dashboard?.totalClients || 0}</div>
          <div className="text-gray-400 text-sm">Total Clientes</div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <TrendingUp size={20} className="text-yellow-400" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">{dashboard?.attendanceRate || 100}%</div>
          <div className="text-gray-400 text-sm">Taxa Comparecimento</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Serviços */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Serviços Mais Vendidos</h2>
          {topServices.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Sem dados ainda</p>
          ) : (
            <div className="space-y-3">
              {topServices.map((service, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-400">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{service.name}</div>
                    <div className="text-gray-400 text-sm">{service.count} agendamentos</div>
                  </div>
                  <div className="text-green-400 font-medium">R$ {service.revenue}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Horários Movimentados */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Horários Mais Movimentados</h2>
          {busyHours.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Sem dados ainda</p>
          ) : (
            <div className="space-y-3">
              {busyHours.slice(0, 5).map((hour, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Clock size={14} className="text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{hour.hour}</div>
                  </div>
                  <div className="text-gray-400 text-sm">{hour.count} agendamentos</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Clientes */}
        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Clientes Mais Frequentes</h2>
          {topClients.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Sem dados ainda</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {topClients.map((client, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                  <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center font-bold text-sm">
                    {client.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{client.name}</div>
                    <div className="text-gray-400 text-sm">{client.visits} visitas • R$ {client.spent}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
