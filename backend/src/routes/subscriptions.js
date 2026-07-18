import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Planos disponíveis (público)
const PLANS = {
  free: {
    name: 'Teste Grátis',
    price: 0,
    duration_days: 14,
    max_services: 5,
    max_professionals: 1,
    max_appointments_month: 50,
    features: ['Agenda básica', 'Até 5 serviços', 'Até 1 profissional', '50 agendamentos/mês'],
  },
  basic: {
    name: 'Básico',
    price: 49,
    duration_days: 30,
    max_services: 10,
    max_professionals: 2,
    max_appointments_month: 200,
    features: ['Tudo do teste grátis', 'Até 10 serviços', 'Até 2 profissionais', '200 agendamentos/mês', 'Lembretes WhatsApp'],
  },
  pro: {
    name: 'Pro',
    price: 99,
    duration_days: 30,
    max_services: 50,
    max_professionals: 5,
    max_appointments_month: -1,
    features: ['Tudo do Básico', 'Até 50 serviços', 'Até 5 profissionais', 'Agendamentos ilimitados', 'Pagamento online', 'Relatórios'],
  },
  business: {
    name: 'Business',
    price: 199,
    duration_days: 30,
    max_services: -1,
    max_professionals: -1,
    max_appointments_month: -1,
    features: ['Tudo do Pro', 'Serviços ilimitados', 'Profissionais ilimitados', 'Multi-unidades', 'Suporte prioritário', 'API'],
  },
};

// Listar planos (público)
router.get('/plans', (req, res) => {
  res.json(PLANS);
});

// Obter assinatura atual (requer auth)
router.get('/current', authenticate, async (req, res) => {
  try {
    console.log('Subscription - userId:', req.userId, 'businessId:', req.businessId);
    const { data: business, error } = await supabase
      .from('businesses')
      .select('subscription_plan, subscription_expires_at, created_at')
      .eq('id', req.businessId)
      .single();

    if (error) {
      console.log('Supabase error:', error);
    }
    console.log('Business found:', business);

    if (!business) {
      return res.status(404).json({ error: 'Negócio não encontrado' });
    }

    if (!business) {
      return res.status(404).json({ error: 'Negócio não encontrado' });
    }

    const now = new Date();
    const createdAt = new Date(business.created_at);
    const trialEnd = new Date(createdAt);
    trialEnd.setDate(trialEnd.getDate() + 14);

    const isTrial = business.subscription_plan === 'free' && now < trialEnd;
    const isExpired = business.subscription_plan !== 'free' && business.subscription_expires_at && new Date(business.subscription_expires_at) < now;
    const daysLeft = isTrial ? Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)) : 0;

    const plan = PLANS[business.subscription_plan] || PLANS.free;

    res.json({
      plan: business.subscription_plan || 'free',
      plan_name: plan.name,
      is_trial: isTrial,
      is_expired: isExpired,
      days_left: daysLeft,
      expires_at: business.subscription_expires_at,
      trial_ends_at: isTrial ? trialEnd.toISOString() : null,
      features: plan.features,
      limits: {
        max_services: plan.max_services,
        max_professionals: plan.max_professionals,
        max_appointments_month: plan.max_appointments_month,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verificar se pode usar funcionalidade (requer auth)
router.get('/check-limit/:feature', authenticate, async (req, res) => {
  try {
    const { data: business } = await supabase
      .from('businesses')
      .select('subscription_plan, subscription_expires_at, created_at')
      .eq('id', req.businessId)
      .single();

    if (!business) {
      return res.status(404).json({ error: 'Negócio não encontrado' });
    }

    const now = new Date();
    const createdAt = new Date(business.created_at);
    const trialEnd = new Date(createdAt);
    trialEnd.setDate(trialEnd.getDate() + 14);

    const isTrial = business.subscription_plan === 'free' && now < trialEnd;
    const isExpired = business.subscription_plan !== 'free' && business.subscription_expires_at && new Date(business.subscription_expires_at) < now;

    if (isExpired) {
      return res.json({ allowed: false, reason: 'expired', message: 'Sua assinatura expirou. Renove para continuar.' });
    }

    const plan = PLANS[business.subscription_plan] || PLANS.free;
    const feature = req.params.feature;

    if (feature === 'services' && plan.max_services !== -1) {
      const { count } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', req.businessId)
        .eq('is_active', true);

      if (count >= plan.max_services) {
        return res.json({ allowed: false, reason: 'limit', message: `Limite de ${plan.max_services} serviços. Faça upgrade para mais.` });
      }
    }

    if (feature === 'professionals' && plan.max_professionals !== -1) {
      const { count } = await supabase
        .from('professionals')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', req.businessId)
        .eq('is_active', true);

      if (count >= plan.max_professionals) {
        return res.json({ allowed: false, reason: 'limit', message: `Limite de ${plan.max_professionals} profissionais. Faça upgrade para mais.` });
      }
    }

    res.json({ allowed: true, plan: plan.name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar checkout para upgrade (requer auth)
router.post('/checkout', authenticate, async (req, res) => {
  try {
    const { plan } = z.object({ plan: z.enum(['basic', 'pro', 'business']) }).parse(req.body);
    const planInfo = PLANS[plan];

    // Buscar configurações de pagamento do negócio
    const { data: business } = await supabase
      .from('businesses')
      .select('payment_settings, slug')
      .eq('id', req.businessId)
      .single();

    const paymentSettings = business?.payment_settings || {};
    const mpToken = paymentSettings.mercadopago_access_token;
    const stripeKey = paymentSettings.stripe_secret_key;
    const pixKey = paymentSettings.pix_key;

    // Tentar Mercado Pago primeiro
    if (mpToken) {
      const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mpToken}`,
        },
        body: JSON.stringify({
          items: [{
            title: `AgendaPro - Plano ${planInfo.name}`,
            quantity: 1,
            unit_price: planInfo.price,
          }],
          external_reference: `sub_${req.businessId}_${plan}`,
          back_urls: {
            success: `${process.env.FRONTEND_URL || 'https://frontend-one-beta-vnz0jybrfj.vercel.app'}/planos?success=true&plan=${plan}`,
            failure: `${process.env.FRONTEND_URL || 'https://frontend-one-beta-vnz0jybrfj.vercel.app'}/planos?failed=true`,
            pending: `${process.env.FRONTEND_URL || 'https://frontend-one-beta-vnz0jybrfj.vercel.app'}/planos?pending=true`,
          },
          auto_return: 'approved',
        }),
      });

      const data = await response.json();
      if (data.init_point) {
        return res.json({ success: true, payment_url: data.init_point, provider: 'mercadopago' });
      }
    }

    // Tentar Stripe
    if (stripeKey) {
      const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${stripeKey}`,
        },
        body: new URLSearchParams({
          'payment_method_types[0]': 'card',
          'line_items[0][price_data][currency]': 'brl',
          'line_items[0][price_data][product_data][name]': `AgendaPro - Plano ${planInfo.name}`,
          'line_items[0][price_data][unit_amount]': planInfo.price * 100,
          'line_items[0][quantity]': '1',
          'mode': 'payment',
          'success_url': `${process.env.FRONTEND_URL || 'https://frontend-one-beta-vnz0jybrfj.vercel.app'}/planos?success=true&plan=${plan}`,
          'cancel_url': `${process.env.FRONTEND_URL || 'https://frontend-one-beta-vnz0jybrfj.vercel.app'}/planos?canceled=true`,
          'metadata[business_id]': req.businessId,
          'metadata[plan]': plan,
        }),
      });

      const data = await response.json();
      if (data.url) {
        return res.json({ success: true, payment_url: data.url, provider: 'stripe' });
      }
    }

    // Se não tem gateway, mas tem PIX
    if (pixKey) {
      return res.json({
        success: true,
        payment_url: null,
        provider: 'pix',
        pix_key: pixKey,
        amount: planInfo.price,
        plan: planInfo.name,
        message: `Envie o PIX de R$${planInfo.price} para ${pixKey} com o assunto: Plano ${planInfo.name} - ${business?.slug}`
      });
    }

    // Nenhum gateway configurado
    res.status(400).json({
      error: 'Nenhum método de pagamento configurado',
      message: 'Configure um gateway de pagamento (Stripe, Mercado Pago ou PIX) em Configurações > Pagamentos'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Plano inválido' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Ativar plano após pagamento confirmado (usado por webhooks)
router.post('/activate', async (req, res) => {
  try {
    const { business_id, plan } = req.body;

    if (!business_id || !plan) {
      return res.status(400).json({ error: 'business_id e plan são obrigatórios' });
    }

    const planInfo = PLANS[plan];
    if (!planInfo) {
      return res.status(400).json({ error: 'Plano inválido' });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + planInfo.duration_days);

    const { error } = await supabase
      .from('businesses')
      .update({
        subscription_plan: plan,
        subscription_expires_at: expiresAt.toISOString(),
      })
      .eq('id', business_id);

    if (error) throw error;

    res.json({ success: true, message: `Plano ${planInfo.name} ativado` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as subscriptionRoutes };
