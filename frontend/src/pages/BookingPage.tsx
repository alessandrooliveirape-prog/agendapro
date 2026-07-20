import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Clock, User, Phone, Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Business {
  name: string;
  phone: string;
  address: string;
  description: string;
  logo_url: string;
  working_hours: Record<string, { start: string; end: string; active: boolean }>;
}

interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  color: string;
}

interface Professional {
  id: string;
  name: string;
  avatar_url: string;
}

interface BookingData {
  service_id: string;
  professional_id: string | null;
  client_name: string;
  client_phone: string;
  client_email: string;
  date: string;
  time: string;
  notes: string;
}

export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessional] = useState<Professional[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const [formData, setFormData] = useState<BookingData>({
    service_id: '',
    professional_id: null,
    client_name: '',
    client_phone: '',
    client_email: '',
    date: '',
    time: '',
    notes: '',
  });

  useEffect(() => {
    loadBusiness();
  }, [slug]);

  useEffect(() => {
    if (selectedService && selectedDate) {
      loadAvailableTimes();
    }
  }, [selectedService, selectedProfessional, selectedDate]);

  async function loadBusiness() {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/public/${slug}`);
      if (!res.ok) throw new Error('Negócio não encontrado');
      const data = await res.json();
      setBusiness(data.business);
      setServices(data.services);
      setProfessional(data.professionals);
    } catch (error: any) {
      toast.error('Negócio não encontrado');
    } finally {
      setLoading(false);
    }
  }

  async function loadAvailableTimes() {
    setLoadingTimes(true);
    try {
      const params = new URLSearchParams({ date: selectedDate, service_id: selectedService!.id });
      if (selectedProfessional) params.set('professional_id', selectedProfessional.id);
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/public/${slug}/available-times?${params}`);
      const data = await res.json();
      setAvailableTimes(data.available_times || []);
    } catch {
      setAvailableTimes([]);
    } finally {
      setLoadingTimes(false);
    }
  }

  async function handleSubmit() {
    if (!selectedService || !selectedDate || !selectedTime || !formData.client_name || !formData.client_phone) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/public/${slug}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: selectedService.id,
          professional_id: selectedProfessional?.id || null,
          client_name: formData.client_name,
          client_phone: formData.client_phone,
          client_email: formData.client_email || undefined,
          date: selectedDate,
          time: selectedTime,
          notes: formData.notes || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao agendar');

      setStep(5);
      toast.success('Agendamento realizado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao agendar');
    } finally {
      setSubmitting(false);
    }
  }

  function getNextDays(count: number) {
    const days = [];
    const today = new Date();
    for (let i = 0; i < count; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const workingDay = business?.working_hours?.[dayOfWeek];
      if (workingDay?.active) {
        days.push({
          date: date.toISOString().split('T')[0],
          label: date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }),
        });
      }
    }
    return days;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Negócio não encontrado</h1>
          <p className="text-gray-400">Verifique o link e tente novamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="gradient-bg py-8 px-4">
        <div className="max-w-lg mx-auto text-center">
          {business.logo_url && (
            <img src={business.logo_url} alt={business.name} className="w-16 h-16 rounded-full mx-auto mb-4 object-cover" />
          )}
          <h1 className="text-2xl font-bold">{business.name}</h1>
          {business.description && <p className="text-white/80 mt-1 text-sm">{business.description}</p>}
          {business.address && <p className="text-white/60 text-sm mt-1">{business.address}</p>}
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 pb-8">
        {/* Progress */}
        {step < 5 && (
          <div className="flex items-center gap-2 mb-6 mt-4">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex-1">
                <div className={`h-1.5 rounded-full ${step >= s ? 'gradient-bg' : 'bg-gray-800'}`} />
              </div>
            ))}
          </div>
        )}

        {/* Step 1: Select Service */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-indigo-400" /> Escolha o serviço
            </h2>
            <div className="space-y-3">
              {services.map(service => (
                <button
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service);
                    setFormData(prev => ({ ...prev, service_id: service.id }));
                    setStep(2);
                  }}
                  className={`w-full p-4 rounded-xl border transition-all text-left ${
                    selectedService?.id === service.id
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: service.color || '#6366f1' }} />
                        {service.name}
                      </div>
                      {service.description && <p className="text-sm text-gray-400 mt-1">{service.description}</p>}
                      <p className="text-sm text-gray-500 mt-1">{service.duration_minutes} min</p>
                    </div>
                    <span className="text-indigo-400 font-semibold">R$ {service.price}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Professional */}
        {step === 2 && (
          <div>
            <button onClick={() => setStep(1)} className="text-gray-400 text-sm mb-4 flex items-center gap-1 hover:text-white">
              <ChevronLeft size={16} /> Voltar
            </button>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User size={20} className="text-indigo-400" /> Escolha o profissional
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setSelectedProfessional(null);
                  setFormData(prev => ({ ...prev, professional_id: null }));
                  setStep(3);
                }}
                className="w-full p-4 rounded-xl border border-gray-800 bg-gray-900 hover:border-gray-700 transition-all text-left"
              >
                <span className="font-medium">Qualquer profissional disponível</span>
              </button>
              {professionals.map(prof => (
                <button
                  key={prof.id}
                  onClick={() => {
                    setSelectedProfessional(prof);
                    setFormData(prev => ({ ...prev, professional_id: prof.id }));
                    setStep(3);
                  }}
                  className="w-full p-4 rounded-xl border border-gray-800 bg-gray-900 hover:border-gray-700 transition-all text-left flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-sm font-medium">
                    {prof.name.charAt(0)}
                  </div>
                  <span className="font-medium">{prof.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Select Date & Time */}
        {step === 3 && (
          <div>
            <button onClick={() => setStep(2)} className="text-gray-400 text-sm mb-4 flex items-center gap-1 hover:text-white">
              <ChevronLeft size={16} /> Voltar
            </button>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock size={20} className="text-indigo-400" /> Escolha data e horário
            </h2>

            {/* Date selection */}
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Data</p>
              <div className="grid grid-cols-4 gap-2">
                {getNextDays(14).map(day => (
                  <button
                    key={day.date}
                    onClick={() => {
                      setSelectedDate(day.date);
                      setSelectedTime('');
                      setFormData(prev => ({ ...prev, date: day.date, time: '' }));
                    }}
                    className={`p-2 rounded-lg text-center text-xs transition-all ${
                      selectedDate === day.date
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time selection */}
            {selectedDate && (
              <div>
                <p className="text-sm text-gray-400 mb-2">Horário</p>
                {loadingTimes ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                  </div>
                ) : availableTimes.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Nenhum horário disponível nesta data</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableTimes.map(time => (
                      <button
                        key={time}
                        onClick={() => {
                          setSelectedTime(time);
                          setFormData(prev => ({ ...prev, time }));
                          setStep(4);
                        }}
                        className={`p-2 rounded-lg text-center text-sm transition-all ${
                          selectedTime === time
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Confirm & Enter Data */}
        {step === 4 && (
          <div>
            <button onClick={() => setStep(3)} className="text-gray-400 text-sm mb-4 flex items-center gap-1 hover:text-white">
              <ChevronLeft size={16} /> Voltar
            </button>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Check size={20} className="text-indigo-400" /> Confirme seu agendamento
            </h2>

            {/* Summary */}
            <div className="bg-gray-900 rounded-xl p-4 mb-4 border border-gray-800">
              <p className="text-sm text-gray-400">Serviço: <span className="text-white">{selectedService?.name}</span></p>
              {selectedProfessional && (
                <p className="text-sm text-gray-400">Profissional: <span className="text-white">{selectedProfessional.name}</span></p>
              )}
              <p className="text-sm text-gray-400">Data: <span className="text-white">{new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span></p>
              <p className="text-sm text-gray-400">Horário: <span className="text-white">{selectedTime}</span></p>
              <p className="text-sm text-gray-400">Duração: <span className="text-white">{selectedService?.duration_minutes} min</span></p>
              <p className="text-lg font-semibold text-indigo-400 mt-2">R$ {selectedService?.price}</p>
            </div>

            {/* Client form */}
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Nome *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Seu nome"
                  value={formData.client_name}
                  onChange={e => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">WhatsApp *</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="(11) 99999-9999"
                  value={formData.client_phone}
                  onChange={e => setFormData(prev => ({ ...prev, client_phone: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Email (opcional)</label>
                <input
                  type="email"
                  className="input"
                  placeholder="seu@email.com"
                  value={formData.client_email}
                  onChange={e => setFormData(prev => ({ ...prev, client_email: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Observações (opcional)</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Alguma observação?"
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting || !formData.client_name || !formData.client_phone}
                className="w-full btn btn-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Agendando...
                  </span>
                ) : (
                  'Confirmar Agendamento'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Success */}
        {step === 5 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Agendamento Confirmado!</h2>
            <p className="text-gray-400 mb-6">
              {selectedService?.name} em {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR')} às {selectedTime}
            </p>
            <p className="text-gray-500 text-sm mb-6">Você receberá uma confirmação pelo WhatsApp.</p>
            <button
              onClick={() => {
                setStep(1);
                setSelectedService(null);
                setSelectedProfessional(null);
                setSelectedDate('');
                setSelectedTime('');
                setFormData({ service_id: '', professional_id: null, client_name: '', client_phone: '', client_email: '', date: '', time: '', notes: '' });
              }}
              className="btn btn-secondary"
            >
              Agendar novamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
