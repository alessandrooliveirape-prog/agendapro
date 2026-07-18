import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

const recurringSchema = z.object({
  service_id: z.string().uuid(),
  professional_id: z.string().uuid().optional(),
  client_name: z.string().min(2),
  client_phone: z.string().min(10),
  client_email: z.string().email().optional(),
  start_date: z.string(), // YYYY-MM-DD
  time: z.string(), // HH:MM
  frequency: z.enum(['weekly', 'biweekly', 'monthly']),
  occurrences: z.number().min(1).max(52), // Máximo 1 ano
  notes: z.string().optional(),
});

// Criar agendamento recorrente
router.post('/', async (req, res) => {
  try {
    const data = recurringSchema.parse(req.body);

    // Buscar serviço
    const { data: service } = await supabase
      .from('services')
      .select('*')
      .eq('id', data.service_id)
      .eq('business_id', req.businessId)
      .single();

    if (!service) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    // Calcular horário de fim
    const [hours, minutes] = data.time.split(':').map(Number);
    const endMinutes = hours * 60 + minutes + service.duration_minutes;
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

    // Gerar datas recorrentes
    const appointments = [];
    let currentDate = new Date(data.start_date);

    for (let i = 0; i < data.occurrences; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];

      // Verificar conflito
      const { data: conflicts } = await supabase
        .from('appointments')
        .select('id')
        .eq('business_id', req.businessId)
        .eq('date', dateStr)
        .eq('time', data.time)
        .neq('status', 'cancelled');

      if (!conflicts || conflicts.length === 0) {
        appointments.push({
          business_id: req.businessId,
          service_id: data.service_id,
          professional_id: data.professional_id || null,
          client_name: data.client_name,
          client_phone: data.client_phone,
          client_email: data.client_email,
          service_name: service.name,
          date: dateStr,
          time: data.time,
          end_time: endTime,
          price: service.price,
          notes: `[Recorrente ${data.frequency}] ${data.notes || ''}`.trim(),
          status: 'confirmed',
        });
      }

      // Próxima data
      if (data.frequency === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (data.frequency === 'biweekly') {
        currentDate.setDate(currentDate.getDate() + 14);
      } else if (data.frequency === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }

    // Inserir agendamentos
    if (appointments.length > 0) {
      const { data: created, error } = await supabase
        .from('appointments')
        .insert(appointments)
        .select();

      if (error) throw error;

      res.json({
        success: true,
        created: created.length,
        skipped: data.occurrences - created.length,
        message: `${created.length} agendamentos criados`
      });
    } else {
      res.json({
        success: true,
        created: 0,
        skipped: data.occurrences,
        message: 'Todos os horários já estavam ocupados'
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Listar agendamentos recorrentes
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, services(name, color)')
      .eq('business_id', req.businessId)
      .like('notes', '[Recorrente%')
      .order('date', { ascending: true })
      .limit(50);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as recurringRoutes };
