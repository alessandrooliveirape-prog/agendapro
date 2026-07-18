import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Save, Copy, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { business } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    description: '',
    working_hours: {
      monday: { start: '09:00', end: '18:00', active: true },
      tuesday: { start: '09:00', end: '18:00', active: true },
      wednesday: { start: '09:00', end: '18:00', active: true },
      thursday: { start: '09:00', end: '18:00', active: true },
      friday: { start: '09:00', end: '18:00', active: true },
      saturday: { start: '09:00', end: '14:00', active: true },
      sunday: { start: '00:00', end: '00:00', active: false },
    },
  });

  const days = {
    monday: 'Segunda-feira',
    tuesday: 'Terça-feira',
    wednesday: 'Quarta-feira',
    thursday: 'Quinta-feira',
    friday: 'Sexta-feira',
    saturday: 'Sábado',
    sunday: 'Domingo',
  };

  useEffect(() => {
    loadBusiness();
  }, []);

  const loadBusiness = async () => {
    try {
      const data = await api.getBusiness();
      const defaultHours = {
        monday: { start: '09:00', end: '18:00', active: true },
        tuesday: { start: '09:00', end: '18:00', active: true },
        wednesday: { start: '09:00', end: '18:00', active: true },
        thursday: { start: '09:00', end: '18:00', active: true },
        friday: { start: '09:00', end: '18:00', active: true },
        saturday: { start: '09:00', end: '14:00', active: true },
        sunday: { start: '00:00', end: '00:00', active: false },
      };

      // Merge working_hours with defaults
      const workingHours = { ...defaultHours };
      if (data.working_hours && typeof data.working_hours === 'object') {
        Object.keys(defaultHours).forEach(day => {
          if (data.working_hours[day]) {
            workingHours[day as keyof typeof workingHours] = {
              ...defaultHours[day as keyof typeof workingHours],
              ...data.working_hours[day],
            };
          }
        });
      }

      setFormData({
        name: data.name || '',
        phone: data.phone || '',
        address: data.address || '',
        description: data.description || '',
        working_hours: workingHours,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateBusiness(formData);
      toast.success('Configurações salvas!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const copyLink = () => {
    const slug = business?.slug || 'meu-negocio';
    navigator.clipboard.writeText(`${window.location.origin}/agendar/${slug}`);
    toast.success('Link copiado!');
  };

  const updateWorkingHours = (day: string, field: string, value: any) => {
    setFormData({
      ...formData,
      working_hours: {
        ...formData.working_hours,
        [day]: {
          ...formData.working_hours[day as keyof typeof formData.working_hours],
          [field]: value,
        },
      },
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-gray-400">Gerencie as configurações do seu negócio</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn btn-primary">
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save size={18} />
              Salvar
            </>
          )}
        </button>
      </div>

      {/* Link público */}
      <div className="glass rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Seu Link de Agendamento</h2>
        <p className="text-gray-400 text-sm mb-4">
          Compartilhe este link com seus clientes para que agendem sozinhos.
        </p>
        <div className="flex gap-3">
          <div className="flex-1 input flex items-center gap-2 text-gray-300">
            {window.location.origin}/agendar/{business?.slug}
          </div>
          <button onClick={copyLink} className="btn btn-secondary">
            <Copy size={18} />
          </button>
        </div>
      </div>

      {/* Dados do negócio */}
      <div className="glass rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Dados do Negócio</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Nome</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="input"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Telefone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Endereço</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Descrição</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="input min-h-[80px] resize-none"
              placeholder="Sobre seu negócio..."
            />
          </div>
        </div>
      </div>

      {/* Horário de funcionamento */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Horário de Funcionamento</h2>
        <div className="space-y-3">
          {Object.entries(days).map(([key, label]) => {
            const hours = formData.working_hours[key as keyof typeof formData.working_hours];
            return (
              <div key={key} className="flex items-center gap-4">
                <label className="flex items-center gap-3 w-40">
                  <input
                    type="checkbox"
                    checked={hours.active}
                    onChange={e => updateWorkingHours(key, 'active', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500"
                  />
                  <span className="text-sm">{label}</span>
                </label>
                {hours.active ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={hours.start}
                      onChange={e => updateWorkingHours(key, 'start', e.target.value)}
                      className="input w-32"
                    />
                    <span className="text-gray-500">até</span>
                    <input
                      type="time"
                      value={hours.end}
                      onChange={e => updateWorkingHours(key, 'end', e.target.value)}
                      className="input w-32"
                    />
                  </div>
                ) : (
                  <span className="text-gray-500 text-sm">Fechado</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
