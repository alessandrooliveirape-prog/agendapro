import { describe, it, expect } from 'vitest';
import './helper.js';
import request from 'supertest';
import { app } from '../app.js';
import { TEST_TOKEN } from './helper.js';

describe('Notifications routes', () => {
  describe('POST /api/notifications/subscribe', () => {
    it('subscribes to push notifications', async () => {
      const res = await request(app)
        .post('/api/notifications/subscribe')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({
          endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
          keys: {
            p256dh: 'test-p256dh-key',
            auth: 'test-auth-key',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('rejects invalid endpoint', async () => {
      const res = await request(app)
        .post('/api/notifications/subscribe')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({
          endpoint: 'not-a-url',
          keys: { p256dh: 'key', auth: 'key' },
        });

      expect(res.status).toBe(400);
    });

    it('rejects missing keys', async () => {
      const res = await request(app)
        .post('/api/notifications/subscribe')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({
          endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        });

      expect(res.status).toBe(400);
    });

    it('rejects without auth', async () => {
      const res = await request(app)
        .post('/api/notifications/subscribe')
        .send({
          endpoint: 'https://fcm.googleapis.com/fcm/send/test',
          keys: { p256dh: 'key', auth: 'key' },
        });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/notifications/unsubscribe', () => {
    it('unsubscribes from push notifications', async () => {
      const res = await request(app)
        .post('/api/notifications/unsubscribe')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/notifications/permission', () => {
    it('returns notification permission status', async () => {
      const res = await request(app)
        .get('/api/notifications/permission')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('permission');
    });
  });
});
