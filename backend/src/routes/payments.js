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

// Criar pagamento via Mercado Pago
router.post('/create-mercadopago', authenticate, async (req, res) => {
  try {
    const { appointment_id, title, amount } = req.body;

    // Buscar configurações do negócio
    const { data: business } = await supabase
      .from('businesses')
      .select('payment_settings')
      .eq('id', req.businessId)
      .single();

    const mpToken = business?.payment_settings?.mercadopago_access_token;

    if (!mpToken) {
      return res.status(400).json({ error: 'Mercado Pago não configurado. Configure em Configurações.' });
    }

    // Criar preferência no Mercado Pago
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mpToken}`,
      },
      body: JSON.stringify({
        items: [{
          title: title || 'Agendamento',
          quantity: 1,
          unit_price: parseFloat(amount),
        }],
        external_reference: appointment_id,
        back_urls: {
          success: `${process.env.FRONTEND_URL || 'https://frontend-one-beta-vnz0jybrfj.vercel.app'}/pagamentos`,
          failure: `${process.env.FRONTEND_URL || 'https://frontend-one-beta-vnz0jybrfj.vercel.app'}/pagamentos`,
          pending: `${process.env.FRONTEND_URL || 'https://frontend-one-beta-vnz0jybrfj.vercel.app'}/pagamentos`,
        },
        auto_return: 'approved',
      }),
    });

    const data = await response.json();

    if (data.init_point) {
      // Atualizar agendamento
      await supabase
        .from('appointments')
        .update({ payment_method: 'mercadopago' })
        .eq('id', appointment_id);

      res.json({ success: true, init_point: data.init_point });
    } else {
      res.status(400).json({ error: 'Erro ao criar pagamento', details: data });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar pagamento via Stripe
router.post('/create-stripe', authenticate, async (req, res) => {
  try {
    const { appointment_id, amount, description } = req.body;

    // Buscar configurações do negócio
    const { data: business } = await supabase
      .from('businesses')
      .select('payment_settings')
      .eq('id', req.businessId)
      .single();

    const stripeKey = business?.payment_settings?.stripe_secret_key;

    if (!stripeKey) {
      return res.status(400).json({ error: 'Stripe não configurado. Configure em Configurações.' });
    }

    // Criar sessão no Stripe
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${stripeKey}`,
      },
      body: new URLSearchParams({
        'payment_method_types[0]': 'card',
        'line_items[0][price_data][currency]': 'brl',
        'line_items[0][price_data][product_data][name]': description || 'Agendamento',
        'line_items[0][price_data][unit_amount]': Math.round(parseFloat(amount) * 100),
        'line_items[0][quantity]': '1',
        'mode': 'payment',
        'success_url': `${process.env.FRONTEND_URL || 'https://frontend-one-beta-vnz0jybrfj.vercel.app'}/pagamentos?success=true`,
        'cancel_url': `${process.env.FRONTEND_URL || 'https://frontend-one-beta-vnz0jybrfj.vercel.app'}/pagamentos?canceled=true`,
        'metadata[appointment_id]': appointment_id,
      }),
    });

    const data = await response.json();

    if (data.url) {
      await supabase
        .from('appointments')
        .update({ payment_method: 'stripe' })
        .eq('id', appointment_id);

      res.json({ success: true, url: data.url });
    } else {
      res.status(400).json({ error: 'Erro ao criar pagamento', details: data });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook do Mercado Pago
router.post('/webhook/mercadopago', async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === 'payment') {
      const appointment_id = data.id;
      // Verificar pagamento via API
      // Atualizar status no banco
    }

    res.status(200).send('OK');
  } catch (error) {
    res.status(200).send('OK');
  }
});

// Webhook do Stripe
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
