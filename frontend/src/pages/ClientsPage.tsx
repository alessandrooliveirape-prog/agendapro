import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Plus, Search, Phone, Mail, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  total_appointments: number;
  total_spent: number;
  last_appointment_at: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const data = await api.getClients(search || undefined);
      setClients(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    await loadClients();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.updateClient(editing.id, formData);
        toast.success('Cliente atualizado!');
      } else {
        await api.createClient(formData);
        toast.success('Cliente adicionado!');
      }
      setShowModal(false);
      setEditing(null);
      resetForm();
      loadClients();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (client: Client) => {
    setEditing(client);
    setFormData({
      name: client.name,
      email: client.email || '',
      phone: client.phone,
      notes: client.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este cliente?')) return;
    try {
      await api.deleteClient(id);
      toast.success('Cliente removido!');
      loadClients();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', notes: '' });
  };

  if (loading && clients.length === 0) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-gray-400">{clients.length} clientes cadastrados</p>
        </div>
        <button
          onClick={() => { resetForm(); setEditing(null); setShowModal(true); }}
          className="btn btn-primary"
        >
          <Plus size={18} />
          Novo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar por nome, telefone ou email..."
            className="input pl-12"
          />
        </div>
        <button onClick={handleSearch} className="btn btn-secondary">
          Buscar
        </button>
      </div>

      {/* Clients List */}
      {clients.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-gray-500">
          <p className="mb-4">Nenhum cliente encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((client) => (
            <div
              key={client.id}
              className="glass rounded-2xl p-6 hover:bg-white/8 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center font-bold text-sm">
                  {client.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{client.name}</div>
                  <div className="text-gray-400 text-sm flex items-center gap-4 flex-wrap">
                    {client.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={12} /> {client.phone}
                      </span>
                    )}
                    {client.email && (
                      <span className="flex items-center gap-1">
                        <Mail size={12} /> {client.email}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-sm text-gray-400">
                    {client.total_appointments} agendamentos
                  </div>
                  <div className="text-sm text-green-400 font-medium">
                    R$ {client.total_spent || 0}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(client)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(client.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
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
              {editing ? 'Editar Cliente' : 'Novo Cliente'}
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
                <label className="block text-sm text-gray-400 mb-2">Telefone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
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
                <label className="block text-sm text-gray-400 mb-2">Observações</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas sobre o cliente..."
                  className="input min-h-[80px] resize-none"
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
