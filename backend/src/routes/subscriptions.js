import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// Planos disponíveis
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
    max_appointments_month: -1, // ilimitado
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

// Listar planos
router.get('/plans', async (req, res) => {
  try {
    res.json(PLANS);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter assinatura atual
router.get('/current', async (req, res) => {
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
    const daysLeft = isTrial ? Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)) : 0;

    const plan = PLANS[business.subscription_plan] || PLANS.free;

    res.json({
      plan: business.subscription_plan,
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

// Verificar se pode usar funcionalidade
router.get('/check-limit/:feature', async (req, res) => {
  try {
    const { data: business } = await supabase
      .from('businesses')
      .select('subscription_plan, subscription_expires_at, created_at')
      .eq('id', req.businessId)
      .single();

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

    // Verificar limites
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

// Atualizar plano (simulado - em produção integraria com gateway de pagamento)
router.post('/upgrade', async (req, res) => {
  try {
    const { plan } = z.object({ plan: z.enum(['basic', 'pro', 'business']) }).parse(req.body);

    const planInfo = PLANS[plan];
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + planInfo.duration_days);

    const { data, error } = await supabase
      .from('businesses')
      .update({
        subscription_plan: plan,
        subscription_expires_at: expiresAt.toISOString(),
      })
      .eq('id', req.businessId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: `Plano ${planInfo.name} ativado com sucesso!`,
      expires_at: expiresAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Plano inválido' });
    }
    res.status(500).json({ error: error.message });
  }
});

export { router as subscriptionRoutes };
