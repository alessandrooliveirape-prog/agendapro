import { Router } from 'express';
import { supabase } from '../config/database.js';

const router = Router();

// Webhook do Mercado Pago
router.post('/mercadopago', async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === 'payment') {
      const { id } = data;
      // Buscar pagamento e atualizar status do agendamento
      console.log(`Pagamento ${id} recebido`);

      // Aqui você integraria com a API do Mercado Pago para verificar o pagamento
      // const payment = await mercadopago.payment.get(id);
      // Atualizar appointment
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(200).send('OK'); // Sempre retornar 200 para webhooks
  }
});

// Webhook do Stripe
router.post('/stripe', async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === 'checkout.session.completed') {
      const { id, metadata } = data.object;
      console.log(`Checkout ${id} completado`);

      // Atualizar status do agendamento
      if (metadata?.appointment_id) {
        await supabase
          .from('appointments')
          .update({ payment_status: 'paid', payment_method: 'stripe' })
          .eq('id', metadata.appointment_id);
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(200).send('OK');
  }
});

// Webhook do WhatsApp (Z-API)
router.post('/whatsapp', async (req, res) => {
  try {
    const { instanceId, data: messageData } = req.body;

    // Processar mensagem recebida do WhatsApp
    if (messageData?.messageText) {
      const text = messageData.messageText.toLowerCase();

      // Comandos simples
      if (text.includes('confirmar') || text.includes('sim')) {
        // Confirmar último agendamento pendente do cliente
        console.log('Confirmação recebida via WhatsApp');
      }

      if (text.includes('cancelar')) {
        // Cancelar agendamento
        console.log('Cancelamento recebido via WhatsApp');
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Erro no webhook WhatsApp:', error);
    res.status(200).send('OK');
  }
});

// Webhook genérico para testes
router.post('/test', (req, res) => {
  console.log('Webhook recebido:', req.body);
  res.json({ received: true, body: req.body });
});

export { router as webhookRoutes };
