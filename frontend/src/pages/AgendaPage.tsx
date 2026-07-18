import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { ChevronLeft, ChevronRight, Plus, Clock, User } from 'lucide-react';
import { format, addDays, subDays, startOfWeek, addWeeks, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface Appointment {
  id: string;
  client_name: string;
  client_phone: string;
  service_name: string;
  professional_id: string;
  date: string;
  time: string;
  end_time: string;
  status: string;
  price: number;
  services?: { name: string; color: string };
}

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
}

interface Professional {
  id: string;
  name: string;
}

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    service_id: '',
    professional_id: '',
    client_name: '',
    client_phone: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const [apts, svcs, profs] = await Promise.all([
        api.getAppointments({ date: dateStr }),
        api.getServices(),
        api.getProfessionals(),
      ]);
      console.log('Serviços carregados:', svcs);
      setAppointments(apts);
      setServices(svcs || []);
      setProfessionals(profs || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados quando o modal abre
  useEffect(() => {
    if (showModal) {
      loadData();
    }
  }, [showModal]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        professional_id: formData.professional_id || undefined,
      };
      await api.createAppointment(payload);
      toast.success('Agendamento criado!');
      setShowModal(false);
      setFormData({
        service_id: '',
        professional_id: '',
        client_name: '',
        client_phone: '',
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: '09:00',
        notes: '',
      });
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.updateAppointmentStatus(id, status);
      toast.success('Status atualizado!');
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    confirmed: 'bg-green-500/20 text-green-400 border-green-500/30',
    completed: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    no_show: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    completed: 'Concluído',
    cancelled: 'Cancelado',
    no_show: 'Não compareceu',
  };

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-gray-400">Gerencie seus agendamentos</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={18} />
          Novo Agendamento
        </button>
      </div>

      {/* Date Navigation */}
      <div className="glass rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <div className="text-lg font-semibold">
              {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
            </div>
            <div className="text-sm text-gray-400">
              {format(selectedDate, 'EEEE, d', { locale: ptBR })}
            </div>
          </div>
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Week view */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {weekDays.map((day) => (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-center transition-colors ${
                isSameDay(day, selectedDate)
                  ? 'gradient-bg text-white'
                  : 'hover:bg-white/10 text-gray-400'
              }`}
            >
              <div className="text-xs uppercase">{format(day, 'EEE', { locale: ptBR })}</div>
              <div className="text-lg font-semibold">{format(day, 'd')}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-6">
          {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Clock size={48} className="mx-auto mb-4 opacity-50" />
            <p>Nenhum agendamento neste dia</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/8 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="text-sm text-gray-400 w-24 font-mono">
                    {apt.time?.slice(0, 5)} - {apt.end_time?.slice(0, 5)}
                  </div>
                  <div className="w-1 h-10 rounded-full" style={{ backgroundColor: apt.services?.color || '#6366f1' }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{apt.client_name}</div>
                    <div className="text-gray-400 text-sm flex items-center gap-2">
                      <span>{apt.service_name}</span>
                      <span>•</span>
                      <span>R$ {apt.price}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`badge border ${statusColors[apt.status]}`}>
                    {statusLabels[apt.status]}
                  </span>
                  {apt.status === 'pending' && (
                    <button
                      onClick={() => handleStatusChange(apt.id, 'confirmed')}
                      className="btn btn-secondary text-xs py-1 px-3"
                    >
                      Confirmar
                    </button>
                  )}
                  {apt.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusChange(apt.id, 'completed')}
                      className="btn btn-secondary text-xs py-1 px-3"
                    >
                      Concluir
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="glass rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-6">Novo Agendamento</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Serviço</label>
                {services.length > 0 ? (
                  <select
                    value={formData.service_id}
                    onChange={e => setFormData({ ...formData, service_id: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Selecione...</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name} — R${s.price}</option>
                    ))}
                  </select>
                ) : (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-400 text-sm">
                    Nenhum serviço cadastrado.{' '}
                    <a href="/servicos" className="underline font-medium">Cadastre um serviço</a> primeiro.
                  </div>
                )}
              </div>

              {professionals.length > 0 && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Profissional</label>
                  <select
                    value={formData.professional_id}
                    onChange={e => setFormData({ ...formData, professional_id: e.target.value })}
                    className="input"
                  >
                    <option value="">Qualquer disponível</option>
                    {professionals.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-2">Nome do Cliente</label>
                <input
                  type="text"
                  value={formData.client_name}
                  onChange={e => setFormData({ ...formData, client_name: e.target.value })}
                  placeholder="Nome completo"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Telefone</label>
                <input
                  type="tel"
                  value={formData.client_phone}
                  onChange={e => setFormData({ ...formData, client_phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                  className="input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Data</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Horário</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Observações</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="O que o cliente precisa? Ex: Corte específico, alergias, preferências..."
                  className="input min-h-[80px] resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Agendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
