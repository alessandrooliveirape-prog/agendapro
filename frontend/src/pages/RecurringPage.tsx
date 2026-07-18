import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Repeat, Calendar, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RecurringPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    service_id: '',
    professional_id: '',
    client_name: '',
    client_phone: '',
    start_date: new Date().toISOString().split('T')[0],
    time: '09:00',
    frequency: 'weekly',
    occurrences: 4,
    notes: '',
  });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const data = await api.getServices();
      setServices(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await api.request('/recurring', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      toast.success(result.message || 'Agendamentos recorrentes criados!');
      setShowModal(false);
      setFormData({
        service_id: '',
        professional_id: '',
        client_name: '',
        client_phone: '',
        start_date: new Date().toISOString().split('T')[0],
        time: '09:00',
        frequency: 'weekly',
        occurrences: 4,
        notes: '',
      });
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
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Agendamentos Recorrentes</h1>
          <p className="text-gray-400">Crie agendamentos que se repetem automaticamente</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={18} />
          Novo Recorrente
        </button>
      </div>

      {/* Info */}
      <div className="glass rounded-2xl p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <Repeat size={24} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold mb-2">Como funciona</h3>
            <p className="text-gray-400 text-sm">
              Crie agendamentos que se repetem semanalmente, quinzenalmente ou mensalmente.
              O sistema verifica automaticamente conflitos de horário e pula os dias ocupados.
              Ideal para clientes que vêm com frequência (barbeiros, personal trainers, etc).
            </p>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="glass rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-6">Novo Agendamento Recorrente</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    Nenhum serviço cadastrado
                  </div>
                )}
              </div>

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
                  <label className="block text-sm text-gray-400 mb-2">Data Início</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Frequência</label>
                  <select
                    value={formData.frequency}
                    onChange={e => setFormData({ ...formData, frequency: e.target.value })}
                    className="input"
                  >
                    <option value="weekly">Semanal</option>
                    <option value="biweekly">Quinzenal</option>
                    <option value="monthly">Mensal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Repetições</label>
                  <input
                    type="number"
                    value={formData.occurrences}
                    onChange={e => setFormData({ ...formData, occurrences: parseInt(e.target.value) || 1 })}
                    min="1"
                    max="52"
                    className="input"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Criar Recorrência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
