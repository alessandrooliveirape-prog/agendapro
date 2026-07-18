import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Users, Calendar, DollarSign, TrendingUp, Shield, Ban, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminStats {
  stats: {
    totalBusinesses: number;
    totalUsers: number;
    totalAppointments: number;
    totalClients: number;
    plans: { free: number; basic: number; pro: number; business: number };
    monthlyRevenue: number;
  };
  recentBusinesses: any[];
}

interface PeriodStats {
  period: string;
  newBusinesses: number;
  newAppointments: number;
  newClients: number;
  periodRevenue: number;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<AdminStats | null>(null);
  const [periodStats, setPeriodStats] = useState<PeriodStats | null>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'businesses'>('overview');
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadPeriodStats();
  }, [period]);

  const loadData = async () => {
    try {
      const [dashData, bizData] = await Promise.all([
        api.request<AdminStats>('/admin/dashboard'),
        api.request<any[]>('/admin/businesses'),
      ]);
      setDashboard(dashData);
      setBusinesses(bizData);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPeriodStats = async () => {
    try {
      const data = await api.request<PeriodStats>(`/admin/stats?period=${period}`);
      setPeriodStats(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSuspend = async (businessId: string) => {
    if (!confirm('Tem certeza que deseja suspender este negócio?')) return;
    try {
      await api.request(`/admin/businesses/${businessId}/suspend`, { method: 'POST' });
      toast.success('Negócio suspenso!');
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleActivate = async (businessId: string) => {
    try {
      await api.request(`/admin/businesses/${businessId}/activate`, { method: 'POST' });
      toast.success('Negócio ativado!');
      loadData();
    } catch (error: any) {
      toast.error(error.message);
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
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield size={28} className="text-purple-400" />
          <h1 className="text-2xl font-bold">Painel Administrativo</h1>
        </div>
        <p className="text-gray-400">Visão completa do AgendaPro</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-3 rounded-xl font-medium transition ${
            activeTab === 'overview' ? 'gradient-bg text-white' : 'glass text-gray-400 hover:text-white'
          }`}
        >
          Visão Geral
        </button>
        <button
          onClick={() => setActiveTab('businesses')}
          className={`px-6 py-3 rounded-xl font-medium transition ${
            activeTab === 'businesses' ? 'gradient-bg text-white' : 'glass text-gray-400 hover:text-white'
          }`}
        >
          Negócios ({businesses.length})
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && dashboard && (
        <>
          {/* Stats Principais */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Building2 size={24} className="text-blue-400" />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">{dashboard.stats.totalBusinesses}</div>
              <div className="text-gray-400 text-sm">Negócios Cadastrados</div>
            </div>

            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Users size={24} className="text-green-400" />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">{dashboard.stats.totalClients}</div>
              <div className="text-gray-400 text-sm">Total Clientes</div>
            </div>

            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Calendar size={24} className="text-purple-400" />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">{dashboard.stats.totalAppointments}</div>
              <div className="text-gray-400 text-sm">Total Agendamentos</div>
            </div>

            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                  <DollarSign size={24} className="text-yellow-400" />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">R$ {dashboard.stats.monthlyRevenue.toLocaleString('pt-BR')}</div>
              <div className="text-gray-400 text-sm">Receita Mensal (estimada)</div>
            </div>
          </div>

          {/* Planos */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="glass rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-gray-400">{dashboard.stats.plans.free}</div>
              <div className="text-gray-500 text-sm">Teste Grátis</div>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{dashboard.stats.plans.basic}</div>
              <div className="text-gray-500 text-sm">Básico (R$49)</div>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{dashboard.stats.plans.pro}</div>
              <div className="text-gray-500 text-sm">Pro (R$99)</div>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{dashboard.stats.plans.business}</div>
              <div className="text-gray-500 text-sm">Business (R$199)</div>
            </div>
          </div>

          {/* Stats por período */}
          <div className="glass rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Performance por Período</h2>
              <select
                value={period}
                onChange={e => setPeriod(e.target.value)}
                className="input w-auto"
              >
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="90d">Últimos 90 dias</option>
              </select>
            </div>
            {periodStats && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <div className="text-2xl font-bold">{periodStats.newBusinesses}</div>
                  <div className="text-gray-400 text-sm">Novos Negócios</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <div className="text-2xl font-bold">{periodStats.newClients}</div>
                  <div className="text-gray-400 text-sm">Novos Clientes</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <div className="text-2xl font-bold">{periodStats.newAppointments}</div>
                  <div className="text-gray-400 text-sm">Novos Agendamentos</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <div className="text-2xl font-bold text-green-400">R$ {periodStats.periodRevenue.toLocaleString('pt-BR')}</div>
                  <div className="text-gray-400 text-sm">Receita no Período</div>
                </div>
              </div>
            )}
          </div>

          {/* Negócios Recentes */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Negócios Recentes</h2>
            <div className="space-y-3">
              {dashboard.recentBusinesses.map((biz: any) => (
                <div key={biz.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                  <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center font-bold text-sm">
                    {biz.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{biz.name}</div>
                    <div className="text-gray-400 text-sm">/{biz.slug}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    biz.subscription_plan === 'pro' ? 'bg-purple-500/20 text-purple-400' :
                    biz.subscription_plan === 'business' ? 'bg-yellow-500/20 text-yellow-400' :
                    biz.subscription_plan === 'basic' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {biz.subscription_plan || 'free'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Businesses Tab */}
      {activeTab === 'businesses' && (
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Todos os Negócios</h2>
          <div className="space-y-3">
            {businesses.map((biz: any) => (
              <div key={biz.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center font-bold">
                  {biz.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{biz.name}</div>
                  <div className="text-gray-400 text-sm">
                    {biz.owner_email} • /{biz.slug}
                  </div>
                  <div className="text-gray-500 text-xs">
                    Criado: {new Date(biz.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  biz.subscription_plan === 'pro' ? 'bg-purple-500/20 text-purple-400' :
                  biz.subscription_plan === 'business' ? 'bg-yellow-500/20 text-yellow-400' :
                  biz.subscription_plan === 'basic' ? 'bg-blue-500/20 text-blue-400' :
                  biz.subscription_plan === 'suspended' ? 'bg-red-500/20 text-red-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {biz.subscription_plan || 'free'}
                </span>
                <div className="flex gap-2">
                  {biz.subscription_plan !== 'suspended' ? (
                    <button
                      onClick={() => handleSuspend(biz.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition text-gray-400 hover:text-red-400"
                      title="Suspender"
                    >
                      <Ban size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleActivate(biz.id)}
                      className="p-2 hover:bg-green-500/20 rounded-lg transition text-gray-400 hover:text-green-400"
                      title="Ativar"
                    >
                      <CheckCircle size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
