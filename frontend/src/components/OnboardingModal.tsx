import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Scissors, UserCog, Link2, ArrowRight, X } from 'lucide-react';

const STORAGE_KEY = 'agendapro_onboarding_done';

const steps = [
  {
    icon: Sparkles,
    title: 'Bem-vindo ao AgendaPro!',
    description:
      'Sua plataforma completa de agendamento online. Em poucos passos, você vai deixar tudo pronto para receber agendamentos 24h.',
  },
  {
    icon: Scissors,
    title: 'Adicione seus serviços',
    description:
      'Cadastre os serviços que você oferece com preços, durações e descrições. Seus clientes vão ver tudo ao agendar.',
    link: { to: '/servicos', label: 'Ir para Serviços' },
  },
  {
    icon: UserCog,
    title: 'Cadastre seus profissionais',
    description:
      'Adicione sua equipe, defina horários de disponibilidade e serviços que cada profissional atende.',
    link: { to: '/profissionais', label: 'Ir para Profissionais' },
  },
  {
    icon: Link2,
    title: 'Compartilhe seu link',
    description:
      'Copie seu link público e compartilhe com seus clientes. Eles vão poder agendar diretamente pelo celular ou computador.',
  },
];

export default function OnboardingModal() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      setShow(true);
    }
  }, []);

  const close = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShow(false);
  };

  const next = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      close();
    }
  };

  if (!show) return null;

  const current = steps[step];
  const Icon = current.icon;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="glass rounded-2xl p-8 max-w-md w-full border border-white/20 shadow-2xl relative"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Close button */}
            <button
              onClick={close}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition"
            >
              <X size={20} />
            </button>

            {/* Progress dots */}
            <div className="flex justify-center gap-2 mb-8">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === step
                      ? 'w-8 bg-indigo-500'
                      : i < step
                      ? 'w-2 bg-indigo-500/50'
                      : 'w-2 bg-white/20'
                  }`}
                />
              ))}
            </div>

            {/* Step content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="text-center mb-8"
              >
                <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-5">
                  <Icon size={32} />
                </div>
                <h2 className="text-xl font-bold mb-3">{current.title}</h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {current.description}
                </p>
                {current.link && (
                  <Link
                    to={current.link.to}
                    onClick={close}
                    className="inline-block mt-4 text-sm text-indigo-400 hover:text-indigo-300 underline underline-offset-4 transition"
                  >
                    {current.link.label}
                  </Link>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={close}
                className="text-sm text-gray-500 hover:text-gray-300 transition"
              >
                Pular
              </button>
              <button onClick={next} className="btn btn-primary px-6 py-2.5 flex items-center gap-2">
                {step === steps.length - 1 ? (
                  'Começar'
                ) : (
                  <>
                    Próximo
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
