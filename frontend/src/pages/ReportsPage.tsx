import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { BarChart3, TrendingUp, TrendingDown, Users, Clock, DollarSign, Download, Calendar } from 'lucide-react';

interface DashboardData {
  period: { start: string; end: string };
  totalAppointments: number;
  todayAppointments: number;
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  totalClients: number;
  newClients: number;
  totalServices: number;
  topServices: { name: string; count: number; revenue: number }[];
  revenueChange: number;
  appointmentsChange: number;
  statusCounts: Record<string, number>;
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

function BarChart({ data, max }: { data: { label: string; value: number }[]; max: number }) {
  if (data.length === 0) return <p className="text-gray-500 text-center py-8">Sem dados</p>;
  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t gradient-bg transition-all duration-500"
            style={{ height: max > 0 ? `${(d.value / max) * 100}%` : '0%' }}
          />
          <span className="text-[10px] text-gray-500 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [busyHours, setBusyHours] = useState<BusyHour[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(today);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = `?start_date=${startDate}&end_date=${endDate}`;
      const [dashData, hoursData, clientsData] = await Promise.all([
        api.request<any>(`/reports/dashboard${params}`),
        api.request<any>(`/reports/busy-hours${params}`),
        api.request<any>(`/reports/top-clients${params}`),
      ]);
      setDashboard(dashData);
      setBusyHours(hoursData.busyHours || []);
      setTopClients(clientsData.topClients || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { loadReports(); }, [loadReports]);

  const exportCSV = async (type: string) => {
    try {
      const url = `${api['token'] ? '' : ''}/api/reports/export?start_date=${startDate}&end_date=${endDate}&type=${type}`;
      const token = localStorage.getItem('agendapro_token');
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${type}_${startDate}_${endDate}.csv`;
      a.click();
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const presets = [
    { label: 'Esta semana', start: getWeekStart(), end: today },
    { label: 'Este mês', start: firstOfMonth, end: today },
    { label: 'Último mês', start: getLastMonthStart(), end: getLastMonthEnd() },
    { label: 'Último trimestre', start: getQuarterStart(), end: today },
    { label: 'Este ano', start: `${new Date().getFullYear()}-01-01`, end: today },
  ];

  if (loading && !dashboard) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const maxBusyHour = Math.max(...busyHours.map(h => h.count), 1);
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const hour = String(i).padStart(2, '0');
    const found = busyHours.find(h => h.hour === `${hour}:00`);
    return { label: `${hour}h`, value: found?.count || 0 };
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-gray-400">Análise completa do seu negócio</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportCSV('appointments')} className="btn btn-secondary text-sm">
            <Download size={16} /> Agendamentos
          </button>
          <button onClick={() => exportCSV('revenue')} className="btn btn-secondary text-sm">
            <Download size={16} /> Receita
          </button>
          <button onClick={() => exportCSV('clients')} className="btn btn-secondary text-sm">
            <Download size={16} /> Clientes
          </button>
        </div>
      </div>

      {/* Date Range Picker */}
      <div className="glass rounded-2xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            <span className="text-sm text-gray-400">Período:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {presets.map(p => (
              <button
                key={p.label}
                onClick={() => { setStartDate(p.start); setEndDate(p.end); }}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                  startDate === p.start && endDate === p.end
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="input text-sm py-1.5 w-36"
            />
            <span className="text-gray-500">até</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="input text-sm py-1.5 w-36"
            />
          </div>
        </div>
      </div>

      {/* KPIs with comparison */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <DollarSign size={20} className="text-green-400" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">R$ {(dashboard?.totalRevenue || 0).toLocaleString('pt-BR')}</div>
          <div className="text-gray-400 text-sm">Receita Total</div>
          {dashboard?.revenueChange !== undefined && dashboard.revenueChange !== 0 && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${dashboard.revenueChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {dashboard.revenueChange > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(dashboard.revenueChange)}% vs período anterior
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <BarChart3 size={20} className="text-indigo-400" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">{dashboard?.totalAppointments || 0}</div>
          <div className="text-gray-400 text-sm">Agendamentos</div>
          {dashboard?.appointmentsChange !== undefined && dashboard.appointmentsChange !== 0 && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${dashboard.appointmentsChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {dashboard.appointmentsChange > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(dashboard.appointmentsChange)}% vs período anterior
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
              <Users size={20} className="text-pink-400" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">{dashboard?.totalClients || 0}</div>
          <div className="text-gray-400 text-sm">Total Clientes</div>
          {dashboard?.newClients ? (
            <div className="text-xs text-indigo-400 mt-2">+{dashboard.newClients} novos no período</div>
          ) : null}
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <TrendingUp size={20} className="text-yellow-400" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">R$ {(dashboard?.paidRevenue || 0).toLocaleString('pt-BR')}</div>
          <div className="text-gray-400 text-sm">Receita Paga</div>
          {dashboard?.pendingRevenue ? (
            <div className="text-xs text-yellow-400 mt-2">R$ {dashboard.pendingRevenue.toLocaleString('pt-BR')} pendente</div>
          ) : null}
        </div>
      </div>

      {/* Status Distribution */}
      {dashboard?.statusCounts && (
        <div className="glass rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Distribuição de Status</h2>
          <div className="grid grid-cols-5 gap-3">
            {[
              { key: 'pending', label: 'Pendente', color: 'text-yellow-400' },
              { key: 'confirmed', label: 'Confirmado', color: 'text-green-400' },
              { key: 'completed', label: 'Concluído', color: 'text-indigo-400' },
              { key: 'cancelled', label: 'Cancelado', color: 'text-red-400' },
              { key: 'no_show', label: 'Não compareceu', color: 'text-gray-400' },
            ].map(s => (
              <div key={s.key} className="text-center p-3 bg-white/5 rounded-xl">
                <div className={`text-xl font-bold ${s.color}`}>{dashboard.statusCounts[s.key] || 0}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Serviços */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Serviços Mais Vendidos</h2>
          {!dashboard?.topServices?.length ? (
            <p className="text-gray-500 text-center py-8">Sem dados ainda</p>
          ) : (
            <div className="space-y-3">
              {dashboard.topServices.map((service, i) => {
                const maxCount = dashboard.topServices[0].count;
                return (
                  <div key={i} className="p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-400">
                          {i + 1}
                        </div>
                        <span className="font-medium">{service.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-green-400 font-medium">R$ {service.revenue}</span>
                        <span className="text-gray-500 text-xs ml-2">{service.count}x</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full gradient-bg rounded-full transition-all duration-500"
                        style={{ width: `${(service.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Horários Movimentados */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Movimentação por Hora</h2>
          <BarChart data={hourlyData} max={maxBusyHour} />
        </div>

        {/* Top Clientes */}
        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Clientes Mais Frequentes</h2>
          {!topClients.length ? (
            <p className="text-gray-500 text-center py-8">Sem dados ainda</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {topClients.map((client, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                  <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center font-bold text-sm flex-shrink-0">
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

// Date helpers
function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function getLastMonthStart() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1, 1);
  return d.toISOString().split('T')[0];
}

function getLastMonthEnd() {
  const d = new Date();
  d.setDate(0);
  return d.toISOString().split('T')[0];
}

function getQuarterStart() {
  const d = new Date();
  const quarter = Math.floor(d.getMonth() / 3);
  d.setMonth(quarter * 3, 1);
  return d.toISOString().split('T')[0];
}
