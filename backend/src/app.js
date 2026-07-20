import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { apiLimiter } from './middleware/rateLimit.js';

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
import { pixRoutes } from './routes/pix.js';
import { adminRoutes } from './routes/admin.js';
import { notificationRoutes } from './routes/notifications.js';
import { unitRoutes } from './routes/units.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', apiLimiter);

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
app.use('/api/pix', pixRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/units', unitRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    error: isProduction ? 'Erro interno do servidor' : (err.message || 'Erro interno do servidor')
  });
});

export { app };
