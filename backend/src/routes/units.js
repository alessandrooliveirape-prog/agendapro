import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

const unitSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  working_hours: z.record(z.object({
    start: z.string(),
    end: z.string(),
    active: z.boolean(),
  })).optional(),
});

// Listar unidades do negócio
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .eq('business_id', req.businessId)
      .order('created_at');

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar unidade
router.post('/', async (req, res) => {
  try {
    const data = unitSchema.parse(req.body);

    const { data: unit, error } = await supabase
      .from('units')
      .insert({
        business_id: req.businessId,
        name: data.name,
        phone: data.phone,
        address: data.address,
        description: data.description,
        working_hours: data.working_hours || {},
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(unit);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Atualizar unidade
router.put('/:id', async (req, res) => {
  try {
    const data = unitSchema.partial().parse(req.body);

    const { data: unit, error } = await supabase
      .from('units')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('business_id', req.businessId)
      .select()
      .single();

    if (error) throw error;
    res.json(unit);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Deletar unidade
router.delete('/:id', async (req, res) => {
  try {
    // Não permitir deletar se há agendamentos vinculados
    const { count } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('unit_id', req.params.id);

    if (count > 0) {
      return res.status(400).json({ error: 'Não é possível excluir unidade com agendamentos vinculados' });
    }

    const { error } = await supabase
      .from('units')
      .delete()
      .eq('id', req.params.id)
      .eq('business_id', req.businessId);

    if (error) throw error;
    res.json({ message: 'Unidade excluída' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Estatísticas de uma unidade
router.get('/:id/stats', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const [appointmentsRes, professionalsRes] = await Promise.all([
      supabase
        .from('appointments')
        .select('id, price, status, date')
        .eq('business_id', req.businessId)
        .eq('unit_id', req.params.id)
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)
        .neq('status', 'cancelled'),
      supabase
        .from('professionals')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', req.businessId)
        .eq('unit_id', req.params.id)
        .eq('is_active', true),
    ]);

    const appointments = appointmentsRes.data || [];
    const totalRevenue = appointments.reduce((sum, a) => sum + parseFloat(a.price || 0), 0);

    res.json({
      monthAppointments: appointments.length,
      monthRevenue: totalRevenue,
      activeProfessionals: professionalsRes.count || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as unitRoutes };
