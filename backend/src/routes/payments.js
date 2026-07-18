import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Criar sessão de pagamento (Stripe Checkout)
router.post('/create-checkout', authenticate, async (req, res) => {
  try {
    const { appointment_id, amount, description } = req.body;

    // Em produção, aqui integraria com Stripe
    // Por enquanto, simulamos o pagamento
    const { data: appointment, error } = await supabase
      .from('appointments')
      .update({
        payment_status: 'paid',
        payment_method: 'online',
        notes: `${description || 'Pagamento online'} - R$${amount}`
      })
      .eq('id', appointment_id)
      .eq('business_id', req.businessId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      appointment,
      message: 'Pagamento processado com sucesso'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook do Stripe (para pagamentos reais)
router.post('/webhook/stripe', async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === 'checkout.session.completed') {
      const { appointment_id } = data.object.metadata;
      await supabase
        .from('appointments')
        .update({ payment_status: 'paid', payment_method: 'stripe' })
        .eq('id', appointment_id);
    }

    res.status(200).send('OK');
  } catch (error) {
    res.status(200).send('OK');
  }
});

// Enviar mensagem de cobrança via WhatsApp
router.post('/send-link', authenticate, async (req, res) => {
  try {
    const { phone, message } = req.body;

    const WHATSAPP_URL = process.env.WHATSAPP_API_URL || 'http://144.33.22.54:8443';
    const WHATSAPP_KEY = process.env.WHATSAPP_API_KEY || 'agendapro2026';
    const INSTANCE = process.env.WHATSAPP_INSTANCE_ID || 'agendapro';

    const response = await fetch(`${WHATSAPP_URL}/message/sendText/${INSTANCE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': WHATSAPP_KEY,
      },
      body: JSON.stringify({
        number: phone.replace(/\D/g, ''),
        text: message,
      }),
    });

    const result = await response.json();
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Status de pagamento
router.get('/status/:appointment_id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('id, payment_status, payment_method, price')
      .eq('id', req.params.appointment_id)
      .eq('business_id', req.businessId)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as paymentRoutes };
