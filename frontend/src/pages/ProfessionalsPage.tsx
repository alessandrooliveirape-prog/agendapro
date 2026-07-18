import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Plus, Edit2, Trash2, User } from 'lucide-react';
import toast from 'react-hot-toast';

interface Professional {
  id: string;
  name: string;
  email: string;
  phone: string;
  is_active: boolean;
}

export default function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Professional | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    loadProfessionals();
  }, []);

  const loadProfessionals = async () => {
    try {
      const data = await api.getProfessionals();
      setProfessionals(data);
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
        await api.updateProfessional(editing.id, formData);
        toast.success('Profissional atualizado!');
      } else {
        await api.createProfessional(formData);
        toast.success('Profissional adicionado!');
      }
      setShowModal(false);
      setEditing(null);
      resetForm();
      loadProfessionals();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (professional: Professional) => {
    setEditing(professional);
    setFormData({
      name: professional.name,
      email: professional.email || '',
      phone: professional.phone || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este profissional?')) return;
    try {
      await api.deleteProfessional(id);
      toast.success('Profissional removido!');
      loadProfessionals();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '' });
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
          <h1 className="text-2xl font-bold">Profissionais</h1>
          <p className="text-gray-400">Gerencie sua equipe</p>
        </div>
        <button
          onClick={() => { resetForm(); setEditing(null); setShowModal(true); }}
          className="btn btn-primary"
        >
          <Plus size={18} />
          Novo Profissional
        </button>
      </div>

      {/* Professionals List */}
      {professionals.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-gray-500">
          <User size={48} className="mx-auto mb-4 opacity-50" />
          <p className="mb-4">Nenhum profissional cadastrado</p>
          <button
            onClick={() => { resetForm(); setEditing(null); setShowModal(true); }}
            className="btn btn-primary"
          >
            Adicionar Primeiro Profissional
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {professionals.map((professional) => (
            <div
              key={professional.id}
              className="glass rounded-2xl p-6 flex items-center gap-4 hover:bg-white/8 transition-colors"
            >
              <div className="w-14 h-14 rounded-full gradient-bg flex items-center justify-center text-xl font-bold">
                {professional.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-lg">{professional.name}</div>
                <div className="text-gray-400 text-sm flex items-center gap-4">
                  {professional.email && <span>{professional.email}</span>}
                  {professional.phone && <span>{professional.phone}</span>}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(professional)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(professional.id)}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                >
                  <Trash2 size={18} />
                </button>
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
              {editing ? 'Editar Profissional' : 'Novo Profissional'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome completo"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Telefone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                  className="input"
                />
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
                  {editing ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
