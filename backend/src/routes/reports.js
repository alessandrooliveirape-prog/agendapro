import { Router } from 'express';
import { supabase } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// Relatório de receita por período
router.get('/revenue', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const start = start_date || new Date(new Date().setDate(1)).toISOString().split('T')[0];
    const end = end_date || new Date().toISOString().split('T')[0];

    const { data: appointments } = await supabase
      .from('appointments')
      .select('date, price, payment_status, status, service_name')
      .eq('business_id', req.businessId)
      .gte('date', start)
      .lte('date', end)
      .neq('status', 'cancelled')
      .order('date');

    // Agrupar por dia
    const dailyRevenue = {};
    appointments?.forEach(a => {
      if (!dailyRevenue[a.date]) {
        dailyRevenue[a.date] = { total: 0, paid: 0, pending: 0, count: 0 };
      }
      dailyRevenue[a.date].total += parseFloat(a.price);
      dailyRevenue[a.date].count++;
      if (a.payment_status === 'paid') {
        dailyRevenue[a.date].paid += parseFloat(a.price);
      } else {
        dailyRevenue[a.date].pending += parseFloat(a.price);
      }
    });

    // Top serviços
    const serviceStats = {};
    appointments?.forEach(a => {
      if (!serviceStats[a.service_name]) {
        serviceStats[a.service_name] = { count: 0, revenue: 0 };
      }
      serviceStats[a.service_name].count++;
      serviceStats[a.service_name].revenue += parseFloat(a.price);
    });

    const topServices = Object.entries(serviceStats)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([name, stats]) => ({ name, ...stats }));

    res.json({
      period: { start, end },
      totalRevenue: appointments?.reduce((sum, a) => sum + parseFloat(a.price), 0) || 0,
      totalAppointments: appointments?.length || 0,
      dailyRevenue,
      topServices,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Horários mais movimentados
router.get('/busy-hours', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const start = start_date || new Date(new Date().setDate(1)).toISOString().split('T')[0];
    const end = end_date || new Date().toISOString().split('T')[0];

    const { data: appointments } = await supabase
      .from('appointments')
      .select('time')
      .eq('business_id', req.businessId)
      .gte('date', start)
      .lte('date', end)
      .neq('status', 'cancelled');

    const hourStats = {};
    appointments?.forEach(a => {
      const hour = a.time?.slice(0, 2);
      if (hour) {
        hourStats[hour] = (hourStats[hour] || 0) + 1;
      }
    });

    const busyHours = Object.entries(hourStats)
      .sort((a, b) => b[1] - a[1])
      .map(([hour, count]) => ({ hour: `${hour}:00`, count }));

    res.json({ busyHours });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clientes mais frequentes
router.get('/top-clients', async (req, res) => {
  try {
    const { data: clients } = await supabase
      .from('appointments')
      .select('client_name, client_phone, price, date')
      .eq('business_id', req.businessId)
      .neq('status', 'cancelled')
      .order('date', { ascending: false });

    const clientStats = {};
    clients?.forEach(c => {
      const key = c.client_phone;
      if (!clientStats[key]) {
        clientStats[key] = { name: c.client_name, phone: c.client_phone, visits: 0, spent: 0, lastVisit: c.date };
      }
      clientStats[key].visits++;
      clientStats[key].spent += parseFloat(c.price);
    });

    const topClients = Object.values(clientStats)
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 10);

    res.json({ topClients });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as reportRoutes };
