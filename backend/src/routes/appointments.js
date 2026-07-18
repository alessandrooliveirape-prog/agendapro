import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { sendWhatsAppMessage, formatConfirmation, formatAppointmentReminder } from '../config/whatsapp.js';
import { sendEmail, appointmentReminderEmail } from '../config/email.js';

const router = Router();

router.use(authenticate);

const appointmentSchema = z.object({
  client_id: z.string().uuid().optional(),
  professional_id: z.string().uuid().optional(),
  service_id: z.string().uuid(),
  client_name: z.string().min(2),
  client_phone: z.string().min(10),
  client_email: z.string().email().optional(),
  date: z.string(), // YYYY-MM-DD
  time: z.string(), // HH:MM
  notes: z.string().optional(),
});

// Listar agendamentos
router.get('/', async (req, res) => {
  try {
    const { date, start_date, end_date, status, professional_id } = req.query;

    let query = supabase
      .from('appointments')
      .select('*, professionals(name), services(name, color, duration_minutes)')
      .eq('business_id', req.businessId)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (date) query = query.eq('date', date);
    if (start_date && end_date) {
      query = query.gte('date', start_date).lte('date', end_date);
    }
    if (status) query = query.eq('status', status);
    if (professional_id) query = query.eq('professional_id', professional_id);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar agendamento
router.post('/', async (req, res) => {
  try {
    const data = appointmentSchema.parse(req.body);

    // Buscar serviço para calcular duração e preço
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('*')
      .eq('id', data.service_id)
      .eq('business_id', req.businessId)
      .single();

    if (serviceError || !service) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    // Calcular horário de fim
    const [hours, minutes] = data.time.split(':').map(Number);
    const endMinutes = hours * 60 + minutes + service.duration_minutes;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

    // Verificar conflito de horário
    const { data: conflicts } = await supabase
      .from('appointments')
      .select('id')
      .eq('business_id', req.businessId)
      .eq('date', data.date)
      .neq('status', 'cancelled')
      .or(`time.lte.${data.time},end_time.gt.${data.time}`)
      .or(`time.lt.${endTime},end_time.gte.${endTime}`);

    if (conflicts && conflicts.length > 0) {
      return res.status(409).json({ error: 'Horário já ocupado' });
    }

    // Criar ou buscar cliente
    let clientId = data.client_id;
    if (!clientId) {
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('business_id', req.businessId)
        .eq('phone', data.client_phone)
        .single();

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const { data: newClient } = await supabase
          .from('clients')
          .insert({
            business_id: req.businessId,
            name: data.client_name,
            phone: data.client_phone,
            email: data.client_email,
          })
          .select('id')
          .single();
        clientId = newClient.id;
      }
    }

    // Criar agendamento
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        business_id: req.businessId,
        client_id: clientId,
        professional_id: data.professional_id,
        service_id: data.service_id,
        client_name: data.client_name,
        client_phone: data.client_phone,
        client_email: data.client_email,
        service_name: service.name,
        date: data.date,
        time: data.time,
        end_time: endTime,
        price: service.price,
        notes: data.notes,
      })
      .select()
      .single();

    if (error) throw error;

    // Buscar dados do negócio para mensagem
    const { data: business } = await supabase
      .from('businesses')
      .select('name, whatsapp_enabled')
      .eq('id', req.businessId)
      .single();

    // Enviar confirmação via WhatsApp
    if (business?.whatsapp_enabled && data.client_phone) {
      const formattedDate = new Date(data.date + 'T12:00:00').toLocaleDateString('pt-BR');
      await sendWhatsAppMessage(
        data.client_phone,
        formatConfirmation({
          client_name: data.client_name,
          service_name: service.name,
          date: formattedDate,
          time: data.time,
          business_name: business.name,
        })
      );
    }

    res.status(201).json(appointment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Atualizar status do agendamento
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = z.object({ status: z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'no_show']) }).parse(req.body);

    const { data: appointment, error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', req.params.id)
      .eq('business_id', req.businessId)
      .select()
      .single();

    if (error) throw error;

    // Se cancelou, decrementar total de agendamentos do cliente
    if (status === 'cancelled' && appointment.client_id) {
      await supabase
        .from('clients')
        .update({ total_appointments: supabase.rpc('decrement') })
        .eq('id', appointment.client_id);
    }

    res.json(appointment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Status inválido' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Deletar agendamento
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', req.params.id)
      .eq('business_id', req.businessId);

    if (error) throw error;
    res.json({ message: 'Agendamento removido' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enviar lembretes (roda via cron)
router.post('/send-reminders', async (req, res) => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Buscar agendamentos de amanhã que não receberam lembrete
    const { data: appointments } = await supabase
      .from('appointments')
      .select('*, businesses(name, phone, whatsapp_enabled, owner_email)')
      .eq('date', tomorrowStr)
      .in('status', ['pending', 'confirmed'])
      .eq('reminder_sent', false);

    if (!appointments || appointments.length === 0) {
      return res.json({ message: 'Nenhum lembrete para enviar', count: 0 });
    }

    let sentCount = 0;

    for (const appointment of appointments) {
      const formattedDate = new Date(appointment.date + 'T12:00:00').toLocaleDateString('pt-BR');

      // Enviar WhatsApp
      if (appointment.businesses?.whatsapp_enabled && appointment.client_phone) {
        await sendWhatsAppMessage(
          appointment.client_phone,
          formatAppointmentReminder({
            client_name: appointment.client_name,
            service_name: appointment.service_name,
            date: formattedDate,
            time: appointment.time,
          })
        );
      }

      // Enviar email
      if (appointment.client_email) {
        const emailData = appointmentReminderEmail({
          client_name: appointment.client_name,
          client_email: appointment.client_email,
          service_name: appointment.service_name,
          date: formattedDate,
          time: appointment.time,
          business_name: appointment.businesses?.name,
        });
        await sendEmail(emailData.to, emailData.subject, emailData.html);
      }

      // Marcar como enviado
      await supabase
        .from('appointments')
        .update({ reminder_sent: true })
        .eq('id', appointment.id);

      sentCount++;
    }

    res.json({ message: `${sentCount} lembretes enviados`, count: sentCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as appointmentRoutes };
