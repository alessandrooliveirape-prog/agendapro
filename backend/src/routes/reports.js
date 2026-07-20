import { Router } from 'express';
import { supabase } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// Helper: get date range defaults
function getDateRange(query) {
  const now = new Date();
  const start = query.start_date || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const end = query.end_date || now.toISOString().split('T')[0];
  return { start, end };
}

// Helper: get previous period for comparison
function getPreviousPeriod(start, end) {
  const startDate = new Date(start + 'T12:00:00');
  const endDate = new Date(end + 'T12:00:00');
  const days = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  const prevEnd = new Date(startDate);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - days + 1);
  return {
    start: prevStart.toISOString().split('T')[0],
    end: prevEnd.toISOString().split('T')[0],
  };
}

// Relatório de receita por período
router.get('/revenue', async (req, res) => {
  try {
    const { start, end } = getDateRange(req.query);

    const { data: appointments } = await supabase
      .from('appointments')
      .select('date, price, payment_status, status, service_name')
      .eq('business_id', req.businessId)
      .gte('date', start)
      .lte('date', end)
      .neq('status', 'cancelled')
      .order('date');

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
    const { start, end } = getDateRange(req.query);

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
    const { start, end } = getDateRange(req.query);

    const { data: clients } = await supabase
      .from('appointments')
      .select('client_name, client_phone, price, date')
      .eq('business_id', req.businessId)
      .gte('date', start)
      .lte('date', end)
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

// Dashboard consolidado com dados comparativos
router.get('/dashboard', async (req, res) => {
  try {
    const { start, end } = getDateRange(req.query);
    const prev = getPreviousPeriod(start, end);
    const today = new Date().toISOString().split('T')[0];

    const [currentRes, previousRes, clientsRes, servicesRes] = await Promise.all([
      supabase
        .from('appointments')
        .select('id, date, price, status, payment_status, service_name, client_name, professional_id')
        .eq('business_id', req.businessId)
        .gte('date', start)
        .lte('date', end)
        .neq('status', 'cancelled'),
      supabase
        .from('appointments')
        .select('id, date, price, status, payment_status')
        .eq('business_id', req.businessId)
        .gte('date', prev.start)
        .lte('date', prev.end)
        .neq('status', 'cancelled'),
      supabase
        .from('clients')
        .select('id, name, total_appointments, total_spent, created_at')
        .eq('business_id', req.businessId),
      supabase
        .from('services')
        .select('id, name, price, is_active')
        .eq('business_id', req.businessId)
        .eq('is_active', true),
    ]);

    const current = currentRes.data || [];
    const previous = previousRes.data || [];
    const clients = clientsRes.data || [];
    const services = servicesRes.data || [];

    // Current period stats
    const totalRevenue = current.reduce((sum, a) => sum + parseFloat(a.price || 0), 0);
    const paidRevenue = current.filter(a => a.payment_status === 'paid').reduce((sum, a) => sum + parseFloat(a.price || 0), 0);
    const todayAppointments = current.filter(a => a.date === today).length;

    // Previous period stats
    const prevRevenue = previous.reduce((sum, a) => sum + parseFloat(a.price || 0), 0);
    const prevAppointments = previous.length;

    // Revenue change percentage
    const revenueChange = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : totalRevenue > 0 ? 100 : 0;
    const appointmentsChange = prevAppointments > 0 ? Math.round(((current.length - prevAppointments) / prevAppointments) * 100) : current.length > 0 ? 100 : 0;

    // Service stats
    const serviceStats = {};
    current.forEach(a => {
      if (!serviceStats[a.service_name]) serviceStats[a.service_name] = { count: 0, revenue: 0 };
      serviceStats[a.service_name].count++;
      serviceStats[a.service_name].revenue += parseFloat(a.price || 0);
    });

    const topServices = Object.entries(serviceStats)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([name, stats]) => ({ name, ...stats }));

    // New clients this period
    const newClients = clients.filter(c => {
      const created = c.created_at?.split('T')[0];
      return created >= start && created <= end;
    }).length;

    // Status distribution
    const statusCounts = { pending: 0, confirmed: 0, completed: 0, cancelled: 0, no_show: 0 };
    current.forEach(a => { statusCounts[a.status] = (statusCounts[a.status] || 0) + 1; });

    res.json({
      period: { start, end },
      previousPeriod: prev,
      totalAppointments: current.length,
      todayAppointments,
      totalRevenue,
      paidRevenue,
      pendingRevenue: totalRevenue - paidRevenue,
      totalClients: clients.length,
      newClients,
      totalServices: services.length,
      topServices,
      revenueChange,
      appointmentsChange,
      statusCounts,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Exportar relatório como CSV
router.get('/export', async (req, res) => {
  try {
    const { start, end, type } = req.query;

    if (type === 'appointments') {
      const { data } = await supabase
        .from('appointments')
        .select('date, time, client_name, client_phone, service_name, price, payment_status, status')
        .eq('business_id', req.businessId)
        .gte('date', start || '')
        .lte('date', end || new Date().toISOString().split('T')[0])
        .order('date');

      const csv = [
        'Data,Horário,Cliente,Telefone,Serviço,Valor,Pagamento,Status',
        ...(data || []).map(a =>
          `${a.date},${a.time},"${a.client_name}",${a.client_phone},"${a.service_name}",${a.price},${a.payment_status},${a.status}`
        ),
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=agendamentos_${start}_${end}.csv`);
      res.send('\uFEFF' + csv);
    } else if (type === 'clients') {
      const { data } = await supabase
        .from('clients')
        .select('name, phone, email, total_appointments, total_spent, created_at')
        .eq('business_id', req.businessId)
        .order('total_spent', { ascending: false });

      const csv = [
        'Nome,Telefone,Email,Total Agendamentos,Total Gasto,Cadastro',
        ...(data || []).map(c =>
          `"${c.name}",${c.phone || ''},${c.email || ''},${c.total_appointments || 0},${c.total_spent || 0},${c.created_at?.split('T')[0] || ''}`
        ),
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=clientes.csv`);
      res.send('\uFEFF' + csv);
    } else if (type === 'revenue') {
      const { data } = await supabase
        .from('appointments')
        .select('date, service_name, price, payment_status')
        .eq('business_id', req.businessId)
        .gte('date', start || '')
        .lte('date', end || new Date().toISOString().split('T')[0])
        .neq('status', 'cancelled')
        .order('date');

      const csv = [
        'Data,Serviço,Valor,Pagamento',
        ...(data || []).map(a =>
          `${a.date},"${a.service_name}",${a.price},${a.payment_status}`
        ),
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=receita_${start}_${end}.csv`);
      res.send('\uFEFF' + csv);
    } else {
      res.status(400).json({ error: 'Tipo de exportação inválido. Use: appointments, clients, revenue' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as reportRoutes };
