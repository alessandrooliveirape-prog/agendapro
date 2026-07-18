import { Router } from 'express';
import { supabase } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Middleware de admin
const requireAdmin = async (req, res, next) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.userId)
      .single();

    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Dashboard admin - visão geral
router.get('/dashboard', authenticate, requireAdmin, async (req, res) => {
  try {
    // Total de negócios
    const { count: totalBusinesses } = await supabase
      .from('businesses')
      .select('*', { count: 'exact', head: true });

    // Total de usuários
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Total de agendamentos
    const { count: totalAppointments } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true });

    // Total de clientes
    const { count: totalClients } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });

    // Assinaturas por plano
    const { data: businesses } = await supabase
      .from('businesses')
      .select('subscription_plan');

    const plans = { free: 0, basic: 0, pro: 0, business: 0 };
    businesses?.forEach(b => {
      const plan = b.subscription_plan || 'free';
      plans[plan] = (plans[plan] || 0) + 1;
    });

    // Receita mensal estimada
    const monthlyRevenue = (plans.basic * 49) + (plans.pro * 99) + (plans.business * 199);

    // Negócios mais recentes
    const { data: recentBusinesses } = await supabase
      .from('businesses')
      .select('id, name, slug, subscription_plan, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({
      stats: {
        totalBusinesses: totalBusinesses || 0,
        totalUsers: totalUsers || 0,
        totalAppointments: totalAppointments || 0,
        totalClients: totalClients || 0,
        plans,
        monthlyRevenue,
      },
      recentBusinesses: recentBusinesses || [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar todos os negócios
router.get('/businesses', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('id, name, slug, owner_email, phone, subscription_plan, subscription_expires_at, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar todos os usuários
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, is_active, created_at, businesses(name, slug)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Estatísticas por período
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const now = new Date();
    let startDate;

    if (period === '7d') {
      startDate = new Date(now.setDate(now.getDate() - 7));
    } else if (period === '30d') {
      startDate = new Date(now.setDate(now.getDate() - 30));
    } else if (period === '90d') {
      startDate = new Date(now.setDate(now.getDate() - 90));
    } else {
      startDate = new Date(0);
    }

    const startDateStr = startDate.toISOString().split('T')[0];

    // Novos negócios no período
    const { count: newBusinesses } = await supabase
      .from('businesses')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDateStr);

    // Novos agendamentos no período
    const { count: newAppointments } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDateStr);

    // Novos clientes no período
    const { count: newClients } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDateStr);

    // Receita no período
    const { data: periodAppointments } = await supabase
      .from('appointments')
      .select('price')
      .gte('created_at', startDateStr)
      .eq('payment_status', 'paid');

    const periodRevenue = periodAppointments?.reduce((sum, a) => sum + parseFloat(a.price), 0) || 0;

    res.json({
      period,
      newBusinesses: newBusinesses || 0,
      newAppointments: newAppointments || 0,
      newClients: newClients || 0,
      periodRevenue,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar negócio (admin)
router.put('/businesses/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { subscription_plan, subscription_expires_at } = req.body;

    const updates = {};
    if (subscription_plan) updates.subscription_plan = subscription_plan;
    if (subscription_expires_at) updates.subscription_expires_at = subscription_expires_at;

    const { data, error } = await supabase
      .from('businesses')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Suspender negócio (admin)
router.post('/businesses/:id/suspend', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .update({ subscription_plan: 'suspended' })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, message: 'Negócio suspenso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ativar negócio (admin)
router.post('/businesses/:id/activate', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .update({ subscription_plan: 'basic' })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, message: 'Negócio ativado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as adminRoutes };
