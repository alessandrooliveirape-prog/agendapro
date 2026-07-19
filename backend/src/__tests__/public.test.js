import { describe, it, expect } from 'vitest';
import './helper.js';
import request from 'supertest';
import { app } from '../app.js';

describe('Public routes', () => {
  describe('GET /api/health', () => {
    it('returns health status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('GET /api/public/:slug', () => {
    it('returns business data for valid slug', async () => {
      const res = await request(app)
        .get('/api/public/barbearia-do-ze');

      expect(res.status).toBe(200);
      expect(res.body.business.name).toBe('Barbearia do Zé');
      expect(Array.isArray(res.body.services)).toBe(true);
      expect(Array.isArray(res.body.professionals)).toBe(true);
    });

    it('returns 404 for invalid slug', async () => {
      const res = await request(app)
        .get('/api/public/nonexistent-business');

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/public/:slug/available-times', () => {
    it('returns available times for a valid date and service', async () => {
      // First get services
      const publicRes = await request(app)
        .get('/api/public/barbearia-do-ze');

      const service = publicRes.body.services[0];

      const res = await request(app)
        .get(`/api/public/barbearia-do-ze/available-times?date=2026-07-21&service_id=${service.id}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.available_times)).toBe(true);
    });

    it('rejects missing required params', async () => {
      const res = await request(app)
        .get('/api/public/barbearia-do-ze/available-times');

      expect(res.status).toBe(400);
    });
  });
});
