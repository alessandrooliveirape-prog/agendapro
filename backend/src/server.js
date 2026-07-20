import { app } from './app.js';
import cron from 'node-cron';

// Lazy Sentry reference
let Sentry;

if (process.env.SENTRY_DSN) {
  try {
    Sentry = await import('@sentry/node');
  } catch {
    // @sentry/node not installed — skip
  }
}

const PORT = process.env.PORT || 3000;

try {
  // Cron job para enviar lembretes a cada 15 minutos (das 8h às 20h)
  cron.schedule('*/15 8-20 * * *', async () => {
    try {
      const res = await fetch(`http://localhost:${PORT}/api/appointments/send-reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.count > 0) {
        console.log(`📬 ${data.count} lembretes enviados automaticamente`);
      }
    } catch (error) {
      if (Sentry) Sentry.captureException(error);
      // Silently fail — reminders are best-effort
    }
  });

  app.listen(PORT, () => {
    console.log(`🚀 AgendaPro API rodando em http://localhost:${PORT}`);
    console.log(`⏰ Lembretes automáticos ativos (a cada 15min, 8h-20h)`);
  });
} catch (error) {
  if (Sentry) Sentry.captureException(error);
  console.error('Erro ao iniciar servidor:', error);
  process.exit(1);
}
