import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Criar sessão de pagamento (Stripe Checkout)
router.post('/create-checkout', authenticate, async (req, res) => {
  try {
    const { appointment_id, amount, description } = z.object({
      appointment_id: z.string().uuid(),
      amount: z.number().positive(),
      description: z.string().optional(),
    }).parse(req.body);

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
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
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
    console.log('Mercado Pago webhook:', type, data);

    if (type === 'payment') {
      const paymentId = data.id;

      // Buscar pagamento via external_reference (ID do appointment)
      const appointmentId = req.body.external_reference;

      if (appointmentId) {
        // Atualizar status do pagamento do agendamento
        await supabase
          .from('appointments')
          .update({ payment_status: 'paid', payment_method: 'mercadopago' })
          .eq('id', appointmentId);
      }
    }

    // Webhook de assinatura (upgrade)
    if (type === 'payment' && req.body.external_reference?.startsWith('sub_')) {
      const parts = req.body.external_reference.split('_');
      // Format: sub_{businessId}_{plan} where businessId is a UUID (no underscores)
      const plan = parts[parts.length - 1];
      const businessId = parts.slice(1, -1).join('_');
      const paymentStatus = req.body.status;

      if (paymentStatus === 'approved') {
        // Ativar plano
        const planInfo = { basic: 30, pro: 30, business: 30 };
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (planInfo[plan] || 30));

        await supabase
          .from('businesses')
          .update({
            subscription_plan: plan,
            subscription_expires_at: expiresAt.toISOString(),
          })
          .eq('id', businessId);

        console.log(`Plano ${plan} ativado para ${businessId}`);
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Erro no webhook:', error);
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

// Histórico de pagamentos
router.get('/history', authenticate, async (req, res) => {
  try {
    // Buscar pagamentos de agendamentos
    const { data: appointments } = await supabase
      .from('appointments')
      .select('id, client_name, service_name, date, price, payment_status, payment_method, created_at')
      .eq('business_id', req.businessId)
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: false })
      .limit(50);

    // Buscar histórico de assinaturas (do Supabase ou API Mercado Pago)
    const { data: business } = await supabase
      .from('businesses')
      .select('subscription_plan, subscription_expires_at, payment_settings')
      .eq('id', req.businessId)
      .single();

    // Se tiver Mercado Pago configurado, buscar pagamentos via API
    let mpPayments = [];
    const mpToken = business?.payment_settings?.mercadopago_access_token;
    if (mpToken) {
      try {
        const response = await fetch('https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=50', {
          headers: { 'Authorization': `Bearer ${mpToken}` },
        });
        const mpData = await response.json();
        mpPayments = mpData.results || [];
      } catch (e) {
        console.log('Erro ao buscar pagamentos MP:', e.message);
      }
    }

    res.json({
      subscription: {
        plan: business?.subscription_plan,
        expires_at: business?.subscription_expires_at,
      },
      appointment_payments: appointments || [],
      mercadopago_payments: mpPayments.map(p => ({
        id: p.id,
        status: p.status,
        status_detail: p.status_detail,
        amount: p.transaction_amount,
        description: p.description,
        date: p.date_created,
        payment_method: p.payment_method_id,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enviar mensagem de cobrança via WhatsApp
router.post('/send-link', authenticate, async (req, res) => {
  try {
    const { phone, message } = z.object({
      phone: z.string().min(10),
      message: z.string().min(1),
    }).parse(req.body);

    const { sendWhatsAppMessage } = await import('../config/whatsapp.js');
    const result = await sendWhatsAppMessage(phone, message);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
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
