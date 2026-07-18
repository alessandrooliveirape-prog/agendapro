import { Router } from 'express';
import { supabase } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// Dashboard completo
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const monthStart = today.slice(0, 7) + '-01';
    const monthEnd = today.slice(0, 7) + '-28';

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
      .select('price, payment_status')
      .eq('business_id', req.businessId)
      .gte('date', monthStart)
      .lte('date', monthEnd)
      .in('status', ['completed', 'confirmed']);

    const monthRevenue = monthAppointments?.reduce((sum, a) => sum + parseFloat(a.price), 0) || 0;
    const paidRevenue = monthAppointments?.filter(a => a.payment_status === 'paid').reduce((sum, a) => sum + parseFloat(a.price), 0) || 0;

    // Total de clientes
    const { count: clientCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', req.businessId);

    // Total de serviços
    const { count: serviceCount } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', req.businessId)
      .eq('is_active', true);

    // Taxa de comparecimento
    const { count: completedCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', req.businessId)
      .gte('date', monthStart)
      .lte('date', monthEnd)
      .eq('status', 'completed');

    const { count: noShowCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', req.businessId)
      .gte('date', monthStart)
      .lte('date', monthEnd)
      .eq('status', 'no_show');

    const attendanceRate = (completedCount || 0) + (noShowCount || 0) > 0
      ? Math.round(((completedCount || 0) / ((completedCount || 0) + (noShowCount || 0))) * 100)
      : 100;

    res.json({
      today: todayCount || 0,
      thisWeek: weekCount || 0,
      monthRevenue,
      paidRevenue,
      pendingRevenue: monthRevenue - paidRevenue,
      totalClients: clientCount || 0,
      totalServices: serviceCount || 0,
      attendanceRate,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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
