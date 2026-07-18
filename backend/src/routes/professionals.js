import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Listar profissionais
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('professionals')
      .select('*')
      .eq('business_id', req.businessId)
      .eq('is_active', true)
      .order('created_at');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar profissional
router.post('/', async (req, res) => {
  try {
    const data = z.object({
      name: z.string().min(2),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      avatar_url: z.string().optional(),
    }).parse(req.body);

    const { data: professional, error } = await supabase
      .from('professionals')
      .insert({ business_id: req.businessId, ...data })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(professional);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Atualizar profissional
router.put('/:id', async (req, res) => {
  try {
    const data = z.object({
      name: z.string().min(2).optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      avatar_url: z.string().optional(),
    }).parse(req.body);

    const { data: professional, error } = await supabase
      .from('professionals')
      .update(data)
      .eq('id', req.params.id)
      .eq('business_id', req.businessId)
      .select()
      .single();

    if (error) throw error;
    res.json(professional);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Deletar profissional
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('professionals')
      .update({ is_active: false })
      .eq('id', req.params.id)
      .eq('business_id', req.businessId);

    if (error) throw error;
    res.json({ message: 'Profissional removido' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar horários de um profissional
router.get('/:id/schedule', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('time, end_time, client_name, service_name, status')
      .eq('business_id', req.businessId)
      .eq('professional_id', req.params.id)
      .eq('date', targetDate)
      .neq('status', 'cancelled')
      .order('time');

    if (error) throw error;
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as professionalRoutes };
