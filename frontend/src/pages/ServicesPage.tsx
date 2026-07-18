import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Plus, Edit2, Trash2, Clock, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  color: string;
  is_active: boolean;
}

const colorOptions = [
  '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4',
];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_minutes: 30,
    price: 0,
    color: '#6366f1',
  });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const data = await api.getServices();
      setServices(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.updateService(editing.id, formData);
        toast.success('Serviço atualizado!');
      } else {
        await api.createService(formData);
        toast.success('Serviço criado!');
      }
      setShowModal(false);
      setEditing(null);
      resetForm();
      loadServices();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (service: Service) => {
    setEditing(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      duration_minutes: service.duration_minutes,
      price: service.price,
      color: service.color,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este serviço?')) return;
    try {
      await api.deleteService(id);
      toast.success('Serviço removido!');
      loadServices();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      duration_minutes: 30,
      price: 0,
      color: '#6366f1',
    });
  };

  const openNew = () => {
    setEditing(null);
    resetForm();
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Serviços</h1>
          <p className="text-gray-400">Gerencie seus serviços e preços</p>
        </div>
        <button onClick={openNew} className="btn btn-primary">
          <Plus size={18} />
          Novo Serviço
        </button>
      </div>

      {/* Services Grid */}
      {services.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-gray-500">
          <p className="mb-4">Nenhum serviço cadastrado</p>
          <button onClick={openNew} className="btn btn-primary">
            Criar Primeiro Serviço
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {services.map((service) => (
            <div key={service.id} className="glass rounded-2xl p-6 hover:bg-white/8 transition-colors">
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: service.color }}
                >
                  {service.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{service.name}</h3>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(service)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {service.description && (
                    <p className="text-gray-400 text-sm mt-1">{service.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <div className="flex items-center gap-1 text-gray-400">
                      <Clock size={14} />
                      {service.duration_minutes} min
                    </div>
                    <div className="flex items-center gap-1 text-green-400 font-medium">
                      <DollarSign size={14} />
                      R$ {service.price}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="glass rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-6">
              {editing ? 'Editar Serviço' : 'Novo Serviço'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Corte masculino"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Descrição</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Opcional"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Duração (min)</label>
                  <input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={e => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 30 })}
                    min="5"
                    max="480"
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Preço (R$)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Cor</label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-10 h-10 rounded-xl transition-transform ${
                        formData.color === color ? 'scale-110 ring-2 ring-white' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditing(null); }}
                  className="btn btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  {editing ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
