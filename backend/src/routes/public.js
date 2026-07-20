import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/database.js';
import { publicBookingLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Página pública de agendamento (acesso pelo slug)
router.get('/:slug', async (req, res) => {
  try {
    const { data: business, error } = await supabase
      .from('businesses')
      .select('id, name, slug, phone, address, description, logo_url, working_hours')
      .eq('slug', req.params.slug)
      .single();

    if (error || !business) {
      return res.status(404).json({ error: 'Negócio não encontrado' });
    }

    // Buscar serviços ativos
    const { data: services } = await supabase
      .from('services')
      .select('id, name, description, duration_minutes, price, color')
      .eq('business_id', business.id)
      .eq('is_active', true)
      .order('created_at');

    // Buscar profissionais ativos
    const { data: professionals } = await supabase
      .from('professionals')
      .select('id, name, avatar_url')
      .eq('business_id', business.id)
      .eq('is_active', true);

    res.json({
      business: {
        name: business.name,
        phone: business.phone,
        address: business.address,
        description: business.description,
        logo_url: business.logo_url,
        working_hours: business.working_hours,
      },
      services: services || [],
      professionals: professionals || [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verificar horários disponíveis
router.get('/:slug/available-times', async (req, res) => {
  try {
    const { date, service_id, professional_id } = req.query;

    if (!date || !service_id) {
      return res.status(400).json({ error: 'Data e serviço são obrigatórios' });
    }

    // Buscar negócio
    const { data: business } = await supabase
      .from('businesses')
      .select('id, working_hours')
      .eq('slug', req.params.slug)
      .single();

    if (!business) {
      return res.status(404).json({ error: 'Negócio não encontrado' });
    }

    // Buscar serviço
    const { data: service } = await supabase
      .from('services')
      .select('duration_minutes')
      .eq('id', service_id)
      .eq('business_id', business.id)
      .single();

    if (!service) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    // Buscar agendamentos do dia
    let query = supabase
      .from('appointments')
      .select('time, end_time')
      .eq('business_id', business.id)
      .eq('date', date)
      .neq('status', 'cancelled');

    if (professional_id) {
      query = query.eq('professional_id', professional_id);
    }

    const { data: existingAppointments } = await query;

    // Buscar bloqueios do dia
    let blockQuery = supabase
      .from('time_blocks')
      .select('start_time, end_time')
      .eq('business_id', business.id)
      .eq('date', date);

    if (professional_id) {
      blockQuery = blockQuery.eq('professional_id', professional_id);
    }

    const { data: blocks } = await blockQuery;

    // Gerar horários disponíveis
    const dayOfWeek = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const workingDay = business.working_hours?.[dayOfWeek];

    if (!workingDay?.active) {
      return res.json({ available_times: [], message: 'Dia não disponível' });
    }

    const availableTimes = [];
    const [startHour, startMin] = workingDay.start.split(':').map(Number);
    const [endHour, endMin] = workingDay.end.split(':').map(Number);

    for (let hour = startHour; hour < endHour; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const time = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        const [tHour, tMin] = time.split(':').map(Number);
        const timeMinutes = tHour * 60 + tMin;
        const endTimeMinutes = timeMinutes + service.duration_minutes;

        // Verificar se não ultrapassa horário de funcionamento
        if (endTimeMinutes > endHour * 60 + endMin) continue;

        // Verificar conflito com agendamentos existentes
        const hasConflict = existingAppointments?.some(apt => {
          const aptStart = apt.time.split(':').map(Number);
          const aptEnd = apt.end_time.split(':').map(Number);
          const aptStartMin = aptStart[0] * 60 + aptStart[1];
          const aptEndMin = aptEnd[0] * 60 + aptEnd[1];
          return timeMinutes < aptEndMin && endTimeMinutes > aptStartMin;
        });

        // Verificar conflito com bloqueios
        const hasBlock = blocks?.some(block => {
          const blockStart = block.start_time.split(':').map(Number);
          const blockEnd = block.end_time.split(':').map(Number);
          const blockStartMin = blockStart[0] * 60 + blockStart[1];
          const blockEndMin = blockEnd[0] * 60 + blockEnd[1];
          return timeMinutes < blockEndMin && endTimeMinutes > blockStartMin;
        });

        // Se hoje, verificar se horário já passou
        const today = new Date().toISOString().split('T')[0];
        if (date === today) {
          const now = new Date();
          const nowMinutes = now.getHours() * 60 + now.getMinutes();
          if (timeMinutes <= nowMinutes) continue;
        }

        if (!hasConflict && !hasBlock) {
          availableTimes.push(time);
        }
      }
    }

    res.json({ available_times: availableTimes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar agendamento público (cliente agenda sozinho)
router.post('/:slug/book', publicBookingLimiter, async (req, res) => {
  try {
    const data = z.object({
      service_id: z.string().uuid(),
      professional_id: z.string().uuid().optional(),
      client_name: z.string().min(2),
      client_phone: z.string().min(10),
      client_email: z.string().email().optional(),
      date: z.string(),
      time: z.string(),
      notes: z.string().optional(),
    }).parse(req.body);

    // Buscar negócio
    const { data: business } = await supabase
      .from('businesses')
      .select('id, name, whatsapp_enabled')
      .eq('slug', req.params.slug)
      .single();

    if (!business) {
      return res.status(404).json({ error: 'Negócio não encontrado' });
    }

    // Buscar serviço
    const { data: service } = await supabase
      .from('services')
      .select('*')
      .eq('id', data.service_id)
      .eq('business_id', business.id)
      .single();

    if (!service) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    // Calcular horário de fim
    const [hours, minutes] = data.time.split(':').map(Number);
    const endMinutes = hours * 60 + minutes + service.duration_minutes;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

    // Verificar conflito
    const { data: conflicts } = await supabase
      .from('appointments')
      .select('id')
      .eq('business_id', business.id)
      .eq('date', data.date)
      .neq('status', 'cancelled')
      .lt('time', endTime)
      .gt('end_time', data.time);

    if (conflicts && conflicts.length > 0) {
      return res.status(409).json({ error: 'Esse horário acabou de ser ocupado. Por favor, escolha outro.' });
    }

    // Criar ou buscar cliente
    let clientId;
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('business_id', business.id)
      .eq('phone', data.client_phone)
      .single();

    if (existingClient) {
      clientId = existingClient.id;
    } else {
      const { data: newClient } = await supabase
        .from('clients')
        .insert({
          business_id: business.id,
          name: data.client_name,
          phone: data.client_phone,
          email: data.client_email,
        })
        .select('id')
        .single();
      clientId = newClient.id;
    }

    // Criar agendamento
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        business_id: business.id,
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

    // Enviar confirmação via WhatsApp
    if (business.whatsapp_enabled && data.client_phone) {
      const { sendWhatsAppMessage, formatConfirmation } = await import('../config/whatsapp.js');
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

    res.status(201).json({
      message: 'Agendamento realizado com sucesso!',
      appointment: {
        id: appointment.id,
        service: service.name,
        date: data.date,
        time: data.time,
        price: service.price,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

export { router as publicRoutes };
