import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Save, Copy, ExternalLink, Bell, BellOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePushNotifications } from '../hooks/usePushNotifications';

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
    payment_settings: {
      stripe_public_key: '',
      stripe_secret_key: '',
      mercadopago_access_token: '',
      mercadopago_public_key: '',
      pix_key: '',
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
        payment_settings: {
          stripe_public_key: data.payment_settings?.stripe_public_key || '',
          stripe_secret_key: data.payment_settings?.stripe_secret_key || '',
          mercadopago_access_token: data.payment_settings?.mercadopago_access_token || '',
          mercadopago_public_key: data.payment_settings?.mercadopago_public_key || '',
          pix_key: data.payment_settings?.pix_key || '',
        },
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
      <div className="glass rounded-2xl p-6 mb-6">
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

      {/* Pagamentos Online */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Pagamentos Online</h2>
        <p className="text-gray-400 text-sm mb-6">
          Configure uma das opções abaixo para que seus clientes possam pagar online.
          O dinheiro vai direto para sua conta.
        </p>

        {/* Stripe */}
        <div className="p-4 bg-white/5 rounded-xl mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <span className="text-indigo-400 font-bold">S</span>
            </div>
            <div>
              <h3 className="font-medium">Stripe</h3>
              <p className="text-gray-400 text-xs">Aceita cartão de crédito e débito</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Chave Pública (Publishable Key)</label>
              <input
                type="text"
                placeholder="pk_live_..."
                className="input"
                value={formData.payment_settings.stripe_public_key}
                onChange={e => setFormData({
                  ...formData,
                  payment_settings: { ...formData.payment_settings, stripe_public_key: e.target.value }
                })}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Chave Secreta (Secret Key)</label>
              <input
                type="password"
                placeholder="sk_live_..."
                className="input"
                value={formData.payment_settings.stripe_secret_key}
                onChange={e => setFormData({
                  ...formData,
                  payment_settings: { ...formData.payment_settings, stripe_secret_key: e.target.value }
                })}
              />
            </div>
          </div>
        </div>

        {/* Mercado Pago */}
        <div className="p-4 bg-white/5 rounded-xl mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <span className="text-yellow-400 font-bold">M</span>
            </div>
            <div>
              <h3 className="font-medium">Mercado Pago</h3>
              <p className="text-gray-400 text-xs">Pix, cartão e boleto - mais popular no Brasil</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Access Token</label>
              <input
                type="password"
                placeholder="APP_USR-..."
                className="input"
                value={formData.payment_settings.mercadopago_access_token}
                onChange={e => setFormData({
                  ...formData,
                  payment_settings: { ...formData.payment_settings, mercadopago_access_token: e.target.value }
                })}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Public Key</label>
              <input
                type="text"
                placeholder="APP_USR-..."
                className="input"
                value={formData.payment_settings.mercadopago_public_key}
                onChange={e => setFormData({
                  ...formData,
                  payment_settings: { ...formData.payment_settings, mercadopago_public_key: e.target.value }
                })}
              />
            </div>
          </div>
        </div>

        {/* PIX */}
        <div className="p-4 bg-white/5 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <span className="text-green-400 font-bold">P</span>
            </div>
            <div>
              <h3 className="font-medium">PIX (Gratuito)</h3>
              <p className="text-gray-400 text-xs">Para quem não tem empresa - apenas chave PIX</p>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Chave PIX (email, CPF ou telefone)</label>
            <input
              type="text"
              placeholder="seu@email.com"
              className="input"
              value={formData.payment_settings.pix_key}
              onChange={e => setFormData({
                ...formData,
                payment_settings: { ...formData.payment_settings, pix_key: e.target.value }
              })}
            />
          </div>
        </div>
      </div>

      {/* Notificações Push */}
      <NotificationsSection />

      {/* Alterar Senha */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Alterar Senha</h2>
        <p className="text-gray-400 text-sm mb-6">Mantenha sua conta segura com uma senha forte.</p>
        <ChangePasswordForm />
      </div>
    </div>
  );
}

function NotificationsSection() {
  const { isSupported, isSubscribed, loading, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported) return null;

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Bell size={20} className="text-indigo-400" /> Notificações Push
      </h2>
      <p className="text-gray-400 text-sm mb-4">
        Receba alertas no celular quando um agendamento for criado ou atualizado.
      </p>
      <button
        onClick={isSubscribed ? unsubscribe : subscribe}
        disabled={loading}
        className={`btn ${isSubscribed ? 'btn-danger' : 'btn-primary'}`}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : isSubscribed ? (
          <>
            <BellOff size={18} /> Desativar Notificações
          </>
        ) : (
          <>
            <Bell size={18} /> Ativar Notificações
          </>
        )}
      </button>
      {isSubscribed && (
        <p className="text-green-400 text-sm mt-2">Notificações push ativadas</p>
      )}
    </div>
  );
}

function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await api.request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      toast.success('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label className="block text-sm text-gray-400 mb-2">Senha Atual</label>
        <input
          type="password"
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          placeholder="••••••"
          className="input"
          required
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-2">Nova Senha</label>
        <input
          type="password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres"
          className="input"
          minLength={6}
          required
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-2">Confirmar Nova Senha</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          placeholder="Repita a nova senha"
          className="input"
          minLength={6}
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          'Alterar Senha'
        )}
      </button>
    </form>
  );
}
