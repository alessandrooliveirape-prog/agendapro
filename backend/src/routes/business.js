import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

const updateBusinessSchema = z.object({
  name: z.string().min(3).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  logo_url: z.string().optional(),
  working_hours: z.object({
    monday: z.object({ start: z.string(), end: z.string(), active: z.boolean() }).optional(),
    tuesday: z.object({ start: z.string(), end: z.string(), active: z.boolean() }).optional(),
    wednesday: z.object({ start: z.string(), end: z.string(), active: z.boolean() }).optional(),
    thursday: z.object({ start: z.string(), end: z.string(), active: z.boolean() }).optional(),
    friday: z.object({ start: z.string(), end: z.string(), active: z.boolean() }).optional(),
    saturday: z.object({ start: z.string(), end: z.string(), active: z.boolean() }).optional(),
    sunday: z.object({ start: z.string(), end: z.string(), active: z.boolean() }).optional(),
  }).optional(),
});

// Obter dados do negócio
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', req.businessId)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar negócio
router.put('/', async (req, res) => {
  try {
    const data = updateBusinessSchema.parse(req.body);

    const { data: updated, error } = await supabase
      .from('businesses')
      .update(data)
      .eq('id', req.businessId)
      .select()
      .single();

    if (error) throw error;
    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Dashboard - Estatísticas
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const monthStart = new Date(today.slice(0, 7) + '-01');
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0); // Last day of previous month = last day of current month

    // Agendamentos de hoje
    const { count: todayCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', req.businessId)
      .eq('date', today)
      .neq('status', 'cancelled');

    // Agendamentos da semana
    const { count: weekCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', req.businessId)
      .gte('date', weekStart.toISOString().split('T')[0])
      .lte('date', weekEnd.toISOString().split('T')[0])
      .neq('status', 'cancelled');

    // Receita mensal
    const { data: monthAppointments } = await supabase
      .from('appointments')
      .select('price')
      .eq('business_id', req.businessId)
      .gte('date', monthStart.toISOString().split('T')[0])
      .lte('date', monthEnd.toISOString().split('T')[0])
      .eq('status', 'completed');

    const monthRevenue = monthAppointments?.reduce((sum, a) => sum + parseFloat(a.price), 0) || 0;

    // Total de clientes
    const { count: clientCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', req.businessId);

    res.json({
      today: todayCount || 0,
      thisWeek: weekCount || 0,
      monthRevenue,
      totalClients: clientCount || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as businessRoutes };
