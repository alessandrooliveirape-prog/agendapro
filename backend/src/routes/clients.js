import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Listar clientes
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;

    let query = supabase
      .from('clients')
      .select('*')
      .eq('business_id', req.businessId)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter cliente por ID
router.get('/:id', async (req, res) => {
  try {
    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', req.params.id)
      .eq('business_id', req.businessId)
      .single();

    if (error || !client) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Buscar histórico de agendamentos
    const { data: appointments } = await supabase
      .from('appointments')
      .select('*, services(name, color)')
      .eq('client_id', client.id)
      .order('date', { ascending: false })
      .limit(10);

    res.json({ ...client, appointments: appointments || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar cliente
router.post('/', async (req, res) => {
  try {
    const data = z.object({
      name: z.string().min(2),
      phone: z.string().min(10),
      email: z.string().email().optional(),
      notes: z.string().optional(),
    }).parse(req.body);

    // Verificar se já existe
    const { data: existing } = await supabase
      .from('clients')
      .select('id')
      .eq('business_id', req.businessId)
      .eq('phone', data.phone)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Cliente já cadastrado com esse telefone' });
    }

    const { data: client, error } = await supabase
      .from('clients')
      .insert({ business_id: req.businessId, ...data })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(client);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Atualizar cliente
router.put('/:id', async (req, res) => {
  try {
    const data = z.object({
      name: z.string().min(2).optional(),
      phone: z.string().min(10).optional(),
      email: z.string().email().optional(),
      notes: z.string().optional(),
    }).parse(req.body);

    const { data: client, error } = await supabase
      .from('clients')
      .update(data)
      .eq('id', req.params.id)
      .eq('business_id', req.businessId)
      .select()
      .single();

    if (error) throw error;
    res.json(client);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Deletar cliente
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', req.params.id)
      .eq('business_id', req.businessId);

    if (error) throw error;
    res.json({ message: 'Cliente removido' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as clientRoutes };
