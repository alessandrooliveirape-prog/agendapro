import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

const serviceSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  duration_minutes: z.number().min(5).max(480),
  price: z.number().min(0),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

// Listar serviços
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', req.businessId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar serviço
router.post('/', async (req, res) => {
  try {
    const data = serviceSchema.parse(req.body);

    const { data: service, error } = await supabase
      .from('services')
      .insert({ business_id: req.businessId, ...data })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(service);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Atualizar serviço
router.put('/:id', async (req, res) => {
  try {
    const data = serviceSchema.partial().parse(req.body);

    const { data: service, error } = await supabase
      .from('services')
      .update(data)
      .eq('id', req.params.id)
      .eq('business_id', req.businessId)
      .select()
      .single();

    if (error) throw error;
    res.json(service);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Deletar serviço (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('services')
      .update({ is_active: false })
      .eq('id', req.params.id)
      .eq('business_id', req.businessId);

    if (error) throw error;
    res.json({ message: 'Serviço removido' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as serviceRoutes };
