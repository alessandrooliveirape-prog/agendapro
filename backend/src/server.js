import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { authRoutes } from './routes/auth.js';
import { businessRoutes } from './routes/business.js';
import { serviceRoutes } from './routes/services.js';
import { professionalRoutes } from './routes/professionals.js';
import { appointmentRoutes } from './routes/appointments.js';
import { clientRoutes } from './routes/clients.js';
import { publicRoutes } from './routes/public.js';
import { webhookRoutes } from './routes/webhooks.js';
import { paymentRoutes } from './routes/payments.js';
import { recurringRoutes } from './routes/recurring.js';
import { reportRoutes } from './routes/reports.js';
import { subscriptionRoutes } from './routes/subscriptions.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'AgendaPro API', version: '1.0.0' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/professionals', professionalRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 AgendaPro API rodando em http://localhost:${PORT}`);
});
