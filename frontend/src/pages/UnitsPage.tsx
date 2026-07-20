import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Building2, Plus, Trash2, Edit, MapPin, Phone, Users, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

interface Unit {
  id: string;
  name: string;
  phone: string;
  address: string;
  description: string;
  working_hours: Record<string, { start: string; end: string; active: boolean }>;
  created_at: string;
}

interface UnitStats {
  monthAppointments: number;
  monthRevenue: number;
  activeProfessionals: number;
}

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [stats, setStats] = useState<Record<string, UnitStats>>({});

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    description: '',
  });

  useEffect(() => {
    loadUnits();
  }, []);

  async function loadUnits() {
    try {
      const data = await api.request<Unit[]>('/units');
      setUnits(data);
      // Load stats for each unit
      for (const unit of data) {
        try {
          const unitStats = await api.request<UnitStats>(`/units/${unit.id}/stats`);
          setStats(prev => ({ ...prev, [unit.id]: unitStats }));
        } catch {
          // Stats not available
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingUnit) {
        await api.request(`/units/${editingUnit.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        toast.success('Unidade atualizada!');
      } else {
        await api.request('/units', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        toast.success('Unidade criada!');
      }
      setShowForm(false);
      setEditingUnit(null);
      setFormData({ name: '', phone: '', address: '', description: '' });
      loadUnits();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar unidade');
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir unidade "${name}"?`)) return;
    try {
      await api.request(`/units/${id}`, { method: 'DELETE' });
      toast.success('Unidade excluída!');
      loadUnits();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir unidade');
    }
  }

  function startEdit(unit: Unit) {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      phone: unit.phone || '',
      address: unit.address || '',
      description: unit.description || '',
    });
    setShowForm(true);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Unidades</h1>
          <p className="text-gray-400">Gerencie as filiais do seu negócio</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingUnit(null); setFormData({ name: '', phone: '', address: '', description: '' }); }}
          className="btn btn-primary"
        >
          <Plus size={18} /> Nova Unidade
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editingUnit ? 'Editar Unidade' : 'Nova Unidade'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nome *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ex: Filial Centro"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Telefone</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Endereço</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Rua, número - Bairro"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Descrição</label>
                <textarea
                  className="input min-h-[60px]"
                  placeholder="Descrição da unidade..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingUnit ? 'Salvar' : 'Criar'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingUnit(null); }}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Units List */}
      {units.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Building2 size={48} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma unidade</h3>
          <p className="text-gray-400 mb-4">
            Crie sua primeira unidade para gerenciar múltiplas filiais.
          </p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            <Plus size={18} /> Criar Unidade
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {units.map(unit => (
            <div key={unit.id} className="glass rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{unit.name}</h3>
                    {unit.address && (
                      <p className="text-gray-400 text-sm flex items-center gap-1">
                        <MapPin size={12} /> {unit.address}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(unit)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <Edit size={16} className="text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(unit.id, unit.name)}
                    className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              </div>

              {unit.phone && (
                <p className="text-gray-400 text-sm flex items-center gap-2 mb-3">
                  <Phone size={14} /> {unit.phone}
                </p>
              )}

              {unit.description && (
                <p className="text-gray-400 text-sm mb-4">{unit.description}</p>
              )}

              {/* Stats */}
              {stats[unit.id] && (
                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-indigo-400 mb-1">
                      <Calendar size={14} />
                    </div>
                    <div className="font-semibold">{stats[unit.id].monthAppointments}</div>
                    <div className="text-xs text-gray-500">Agendamentos/mês</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
                      R$
                    </div>
                    <div className="font-semibold">R$ {stats[unit.id].monthRevenue}</div>
                    <div className="text-xs text-gray-500">Receita/mês</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-pink-400 mb-1">
                      <Users size={14} />
                    </div>
                    <div className="font-semibold">{stats[unit.id].activeProfessionals}</div>
                    <div className="text-xs text-gray-500">Profissionais</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
