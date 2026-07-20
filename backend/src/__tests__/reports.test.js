import { describe, it, expect } from 'vitest';
import './helper.js';
import request from 'supertest';
import { app } from '../app.js';
import { TEST_TOKEN } from './helper.js';

describe('Reports routes', () => {
  describe('GET /api/reports/dashboard', () => {
    it('returns dashboard data', async () => {
      const res = await request(app)
        .get('/api/reports/dashboard')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalAppointments');
      expect(res.body).toHaveProperty('totalRevenue');
      expect(res.body).toHaveProperty('paidRevenue');
      expect(res.body).toHaveProperty('totalClients');
      expect(res.body).toHaveProperty('topServices');
      expect(res.body).toHaveProperty('statusCounts');
    });

    it('accepts date range parameters', async () => {
      const res = await request(app)
        .get('/api/reports/dashboard?start_date=2026-07-01&end_date=2026-07-31')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body.period).toEqual({ start: '2026-07-01', end: '2026-07-31' });
    });

    it('rejects without auth', async () => {
      const res = await request(app).get('/api/reports/dashboard');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/reports/revenue', () => {
    it('returns revenue data', async () => {
      const res = await request(app)
        .get('/api/reports/revenue')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalRevenue');
      expect(res.body).toHaveProperty('totalAppointments');
      expect(res.body).toHaveProperty('dailyRevenue');
      expect(res.body).toHaveProperty('topServices');
    });

    it('accepts date range', async () => {
      const res = await request(app)
        .get('/api/reports/revenue?start_date=2026-07-01&end_date=2026-07-15')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body.period.start).toBe('2026-07-01');
      expect(res.body.period.end).toBe('2026-07-15');
    });
  });

  describe('GET /api/reports/busy-hours', () => {
    it('returns busy hours data', async () => {
      const res = await request(app)
        .get('/api/reports/busy-hours')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('busyHours');
      expect(Array.isArray(res.body.busyHours)).toBe(true);
    });
  });

  describe('GET /api/reports/top-clients', () => {
    it('returns top clients', async () => {
      const res = await request(app)
        .get('/api/reports/top-clients')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('topClients');
      expect(Array.isArray(res.body.topClients)).toBe(true);
    });
  });

  describe('GET /api/reports/export', () => {
    it('exports appointments as CSV', async () => {
      const res = await request(app)
        .get('/api/reports/export?type=appointments&start_date=2026-07-01&end_date=2026-07-31')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('agendamentos');
    });

    it('exports clients as CSV', async () => {
      const res = await request(app)
        .get('/api/reports/export?type=clients')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('clientes');
    });

    it('exports revenue as CSV', async () => {
      const res = await request(app)
        .get('/api/reports/export?type=revenue&start_date=2026-07-01&end_date=2026-07-31')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
    });

    it('rejects invalid export type', async () => {
      const res = await request(app)
        .get('/api/reports/export?type=invalid')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).toBe(400);
    });
  });
});
