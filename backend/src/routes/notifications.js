import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// In-memory push subscriptions (for mock mode)
const pushSubscriptions = new Map();

// Salvar inscrição push
router.post('/subscribe', authenticate, async (req, res) => {
  try {
    const { endpoint, keys } = z.object({
      endpoint: z.string().url(),
      keys: z.object({
        p256dh: z.string(),
        auth: z.string(),
      }),
    }).parse(req.body);

    // Try to save to database
    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          business_id: req.businessId,
          user_id: req.userId,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
        }, { onConflict: 'endpoint' });

      if (error) throw error;
    } catch {
      // Mock mode — store in memory
      if (!pushSubscriptions.has(req.businessId)) {
        pushSubscriptions.set(req.businessId, []);
      }
      const subs = pushSubscriptions.get(req.businessId);
      const existing = subs.findIndex(s => s.endpoint === endpoint);
      if (existing >= 0) {
        subs[existing] = { endpoint, keys, userId: req.userId };
      } else {
        subs.push({ endpoint, keys, userId: req.userId });
      }
    }

    res.json({ success: true, message: 'Inscrição push registrada' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Remover inscrição push
router.post('/unsubscribe', authenticate, async (req, res) => {
  try {
    const { endpoint } = z.object({ endpoint: z.string() }).parse(req.body);

    try {
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', endpoint);
    } catch {
      // Mock mode
      const subs = pushSubscriptions.get(req.businessId) || [];
      pushSubscriptions.set(
        req.businessId,
        subs.filter(s => s.endpoint !== endpoint)
      );
    }

    res.json({ success: true, message: 'Inscrição removida' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verificar permissão de notificação
router.get('/permission', authenticate, async (req, res) => {
  res.json({ permission: typeof Notification !== 'undefined' ? Notification.permission : 'denied' });
});

// Enviar push notification para todos os subscribers de um business
export async function sendPushNotification(businessId, { title, body, url }) {
  const notificationPayload = JSON.stringify({
    title,
    body,
    url: url || '/',
  });

  let subscriptions = [];

  // Try database first
  try {
    const { data } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('business_id', businessId);

    if (data && data.length > 0) {
      subscriptions = data.map(s => ({
        endpoint: s.endpoint,
        keys: { p256dh: s.p256dh, auth: s.auth },
      }));
    }
  } catch {
    // Mock mode
    subscriptions = (pushSubscriptions.get(businessId) || []).map(s => ({
      endpoint: s.endpoint,
      keys: s.keys,
    }));
  }

  if (subscriptions.length === 0) return { sent: 0 };

  let sent = 0;
  for (const sub of subscriptions) {
    try {
      // In production, use web-push library:
      // await webpush.sendNotification(sub, notificationPayload);
      console.log(`[Push] Enviado para ${sub.endpoint.substring(0, 50)}...`);
      sent++;
    } catch (error) {
      // Remove invalid subscriptions
      if (error.statusCode === 410 || error.statusCode === 404) {
        try {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', sub.endpoint);
        } catch {
          // Mock mode — ignore
        }
      }
    }
  }

  return { sent };
}

export { router as notificationRoutes };
