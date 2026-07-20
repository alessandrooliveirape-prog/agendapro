import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqItems = [
  {
    question: 'O que é o AgendaPro?',
    answer:
      'O AgendaPro é uma plataforma completa de agendamento online para profissionais de serviços como barbeiros, dentistas, personal trainers, esteticistas e muito mais. Com ele, seus clientes podem agendar horários 24h pelo link público, e você gerencia tudo em um painel fácil e intuitivo.',
  },
  {
    question: 'Como funciona o teste grátis?',
    answer:
      'Ao criar sua conta, você recebe automaticamente 7 dias de teste grátis com acesso a todas as funcionalidades do plano profissional. Não é necessário informar dados de pagamento durante o período de teste. Ao final, escolha o plano que melhor se adapta às suas necessidades.',
  },
  {
    question: 'Preciso de cartão de crédito para testar?',
    answer:
      'Não! O teste grátis é totalmente gratuito e sem necessidade de cartão de crédito. Você pode usar todas as funcionalidades durante 7 dias sem nenhuma cobrança.',
  },
  {
    question: 'Como funciona o lembrete via WhatsApp?',
    answer:
      'O AgendaPro envia automaticamente lembretes para seus clientes pelo WhatsApp antes do agendamento. O horário do lembrete é configurável nas configurações (por exemplo, 24h ou 1h antes). Seus clientes recebem uma mensagem amigável com os detalhes do agendamento.',
  },
  {
    question: 'Quais formas de pagamento são aceitas?',
    answer:
      'Aceitamos pagamento via Pix, cartão de crédito e boleto bancário. Os planos são cobrados mensalmente, e você pode gerenciar seus pagamentos diretamente no painel.',
  },
  {
    question: 'Posso cancelar a qualquer momento?',
    answer:
      'Sim! Você pode cancelar sua assinatura a qualquer momento pelo painel de configurações. Não há multa ou taxa de cancelamento. O acesso continua até o final do período já pago.',
  },
  {
    question: 'Quantos profissionais posso cadastrar?',
    answer:
      'Isso depende do plano escolhido. No plano gratuito, você pode cadastrar até 1 profissional. Nos planos pagos, o limite aumenta conforme o plano. Confira os detalhes na página de planos.',
  },
  {
    question: 'Como meus clientes agendam?',
    answer:
      'Seus clientes acessam seu link público (agendapro.com/seu-slug), escolhem o profissional, o serviço, selecionam um horário disponível e confirmam o agendamento. É rápido, simples e funciona em qualquer dispositivo — celular, tablet ou computador.',
  },
  {
    question: 'Meus dados estão seguros?',
    answer:
      'Sim. Utilizamos criptografia em trânsito (HTTPS) e em repouso. Seus dados são armazenados em servidores seguros e nunca são compartilhados com terceiros. Seguimos as melhores práticas de segurança da informação para proteger suas informações e as de seus clientes.',
  },
  {
    question: 'Como faço para excluir minha conta?',
    answer:
      'Para excluir sua conta, acesse Configurações > Minha Conta e clique em "Excluir Conta". A exclusão é permanente e todos os seus dados serão removidos. Se tiver uma assinatura ativa, ela será cancelada automaticamente.',
  },
];

function FAQItem({
  item,
  isOpen,
  onToggle,
}: {
  item: (typeof faqItems)[number];
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="glass rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-5 text-left"
      >
        <span className="font-medium text-white pr-4">{item.question}</span>
        <ChevronDown
          size={20}
          className={`text-gray-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-6 pb-5 text-gray-400 text-sm leading-relaxed">
          {item.answer}
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(prev => (prev === index ? null : index));
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <HelpCircle size={28} className="text-indigo-400" />
        <h1 className="text-2xl font-bold">Perguntas Frequentes</h1>
      </div>
      <p className="text-gray-400 mb-8">
        Encontre respostas para as dúvidas mais comuns sobre o AgendaPro.
      </p>

      {/* FAQ list */}
      <div className="space-y-3">
        {faqItems.map((item, index) => (
          <FAQItem
            key={index}
            item={item}
            isOpen={openIndex === index}
            onToggle={() => toggle(index)}
          />
        ))}
      </div>

      {/* Contact */}
      <div className="mt-10 glass rounded-2xl p-6 text-center">
        <p className="text-gray-400 mb-3">
          Não encontrou o que procurava?
        </p>
        <a
          href="mailto:suporte@agendapro.com"
          className="btn btn-primary px-6 py-2.5"
        >
          Fale conosco
        </a>
      </div>
    </div>
  );
}
