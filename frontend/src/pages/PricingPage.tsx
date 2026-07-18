import { useState } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Check, Star, Zap, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';

const plans = [
  {
    id: 'basic',
    name: 'Básico',
    price: 49,
    period: '/mês',
    icon: <Zap size={24} />,
    color: 'from-blue-500 to-cyan-500',
    features: [
      'Até 10 serviços',
      'Até 2 profissionais',
      '200 agendamentos/mês',
      'Lembretes WhatsApp',
      'Link público',
      'Suporte por email',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99,
    period: '/mês',
    icon: <Star size={24} />,
    color: 'from-purple-500 to-pink-500',
    popular: true,
    features: [
      'Até 50 serviços',
      'Até 5 profissionais',
      'Agendamentos ilimitados',
      'Pagamento online',
      'Relatórios avançados',
      'Agendamentos recorrentes',
      'Suporte prioritário',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: 199,
    period: '/mês',
    icon: <Crown size={24} />,
    color: 'from-orange-500 to-red-500',
    features: [
      'Serviços ilimitados',
      'Profissionais ilimitados',
      'Agendamentos ilimitados',
      'Multi-unidades',
      'API de integração',
      'Relatórios completos',
      'Suporte dedicado',
      'Onboarding personalizado',
    ],
  },
];

export default function PricingPage() {
  const { subscription, refresh } = useSubscription();
  const [loading, setLoading] = useState<string | null>(null);
  const [pixModal, setPixModal] = useState<{ key: string; amount: number; plan: string } | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const handleUpgrade = async (planId: string) => {
    setLoading(planId);
    try {
      const result = await api.request<{ payment_url?: string; provider?: string; pix_key?: string; amount?: number; plan?: string; message?: string }>('/subscriptions/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: planId }),
      });

      if (result.payment_url) {
        window.location.href = result.payment_url;
      } else if (result.pix_key) {
        const plan = plans.find(p => p.id === planId);
        setPixModal({
          key: result.pix_key,
          amount: result.amount || plan?.price || 0,
          plan: result.plan || plan?.name || '',
        });
        // Gerar QR Code
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=pix:${result.pix_key}?amount=${result.amount || plan?.price || 0}`;
        setQrCodeUrl(qrUrl);
      } else {
        toast(result.message || 'Configure um gateway de pagamento em Configurações > Pagamentos', {
          icon: '💳',
          duration: 8000,
        });
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(null);
    }
  };

  const copyPixKey = () => {
    if (pixModal) {
      navigator.clipboard.writeText(pixModal.key);
      toast.success('Chave PIX copiada!');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Escolha seu plano</h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Comece grátis por 14 dias. Depois, escolha o plano que melhor se encaixa no seu negócio.
        </p>
        {subscription?.is_trial && (
          <div className="inline-block mt-4 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-sm">
            Você está no teste grátis — {subscription.days_left} dias restantes
          </div>
        )}
      </div>

      {/* Planos */}
      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const isCurrentPlan = subscription?.plan === plan.id;
          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-8 transition-all ${
                plan.popular
                  ? 'glass border-2 border-purple-500/50 scale-105'
                  : 'glass'
              } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-sm font-medium">
                  Mais Popular
                </div>
              )}

              {isCurrentPlan && (
                <div className="absolute -top-4 right-4 px-3 py-1 bg-green-500 rounded-full text-xs font-medium">
                  Plano Atual
                </div>
              )}

              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center text-white mb-6`}>
                {plan.icon}
              </div>

              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">R${plan.price}</span>
                <span className="text-gray-400">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <Check size={16} className="text-green-400 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={loading === plan.id || isCurrentPlan}
                className={`w-full py-3 rounded-xl font-medium transition ${
                  isCurrentPlan
                    ? 'bg-green-500/20 text-green-400 cursor-default'
                    : plan.popular
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {loading === plan.id ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                ) : isCurrentPlan ? (
                  'Plano Atual'
                ) : (
                  'Escolher Plano'
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">Perguntas Frequentes</h2>
        <div className="space-y-4">
          <div className="glass rounded-xl p-6">
            <h3 className="font-semibold mb-2">Posso cancelar a qualquer momento?</h3>
            <p className="text-gray-400 text-sm">Sim! Sem fidelidade. Cancele quando quiser pelo painel. Seus dados ficam disponíveis por 30 dias após o cancelamento.</p>
          </div>
          <div className="glass rounded-xl p-6">
            <h3 className="font-semibold mb-2">O teste grátis tem cartão?</h3>
            <p className="text-gray-400 text-sm">Não! 14 dias totalmente grátis, sem precisar de cartão de crédito.</p>
          </div>
          <div className="glass rounded-xl p-6">
            <h3 className="font-semibold mb-2">Posso mudar de plano depois?</h3>
            <p className="text-gray-400 text-sm">Sim! Você pode fazer upgrade ou downgrade a qualquer momento. A diferença é proporcional.</p>
          </div>
        </div>
      </div>

      {/* PIX QR Code Modal */}
      {pixModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="glass rounded-2xl w-full max-w-sm p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Pagamento via PIX</h2>
            <p className="text-gray-400 text-sm mb-6">Plano {pixModal.plan} — R${pixModal.amount}</p>

            {qrCodeUrl && (
              <div className="mb-6">
                <img src={qrCodeUrl} alt="QR Code PIX" className="mx-auto rounded-xl" />
              </div>
            )}

            <div className="mb-4">
              <p className="text-gray-400 text-xs mb-2">Chave PIX (CPF):</p>
              <div className="flex items-center gap-2 justify-center">
                <span className="text-lg font-mono font-bold">{pixModal.key}</span>
                <button onClick={copyPixKey} className="p-2 hover:bg-white/10 rounded-lg transition">
                  <span className="text-gray-400">📋</span>
                </button>
              </div>
            </div>

            <div className="mb-6 p-4 bg-white/5 rounded-xl">
              <p className="text-gray-400 text-xs mb-1">Valor:</p>
              <p className="text-2xl font-bold gradient-text">R${pixModal.amount}</p>
            </div>

            <p className="text-gray-500 text-xs mb-4">
              Após pagar, envie o comprovante pelo WhatsApp ou aguarde a confirmação automática.
            </p>

            <button
              onClick={() => setPixModal(null)}
              className="w-full py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
