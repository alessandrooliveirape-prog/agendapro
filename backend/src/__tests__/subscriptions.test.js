import { describe, it, expect } from 'vitest';
import './helper.js';
import request from 'supertest';
import { app } from '../app.js';
import { TEST_TOKEN } from './helper.js';

describe('Subscriptions routes', () => {
  describe('GET /api/subscriptions/plans', () => {
    it('returns available plans', async () => {
      const res = await request(app)
        .get('/api/subscriptions/plans');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('free');
      expect(res.body).toHaveProperty('basic');
      expect(res.body).toHaveProperty('pro');
      expect(res.body).toHaveProperty('business');
      expect(res.body.basic).toHaveProperty('price');
      expect(res.body.basic).toHaveProperty('features');
    });
  });

  describe('GET /api/subscriptions/current', () => {
    it('returns current subscription', async () => {
      const res = await request(app)
        .get('/api/subscriptions/current')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('plan');
      expect(res.body).toHaveProperty('plan_name');
      expect(res.body).toHaveProperty('is_trial');
      expect(res.body).toHaveProperty('features');
      expect(res.body).toHaveProperty('limits');
    });

    it('rejects without auth', async () => {
      const res = await request(app).get('/api/subscriptions/current');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/subscriptions/check-limit/:feature', () => {
    it('checks services limit', async () => {
      const res = await request(app)
        .get('/api/subscriptions/check-limit/services')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('allowed');
    });

    it('checks professionals limit', async () => {
      const res = await request(app)
        .get('/api/subscriptions/check-limit/professionals')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('allowed');
    });
  });

  describe('POST /api/subscriptions/cancel', () => {
    it('cancels subscription (downgrades to free)', async () => {
      const res = await request(app)
        .post('/api/subscriptions/cancel')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
