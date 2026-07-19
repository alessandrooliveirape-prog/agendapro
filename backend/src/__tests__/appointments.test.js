import { describe, it, expect } from 'vitest';
import './helper.js';
import request from 'supertest';
import { app } from '../app.js';
import { TEST_TOKEN } from './helper.js';

describe('Appointments routes', () => {
  describe('GET /api/appointments', () => {
    it('lists appointments for authenticated business', async () => {
      const res = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('filters by date', async () => {
      const res = await request(app)
        .get('/api/appointments?date=2026-07-20')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('rejects without auth', async () => {
      const res = await request(app).get('/api/appointments');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/appointments', () => {
    it('creates an appointment with valid data', async () => {
      // Get a service first
      const servicesRes = await request(app)
        .get('/api/services')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      const service = servicesRes.body[0];

      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({
          service_id: service.id,
          client_name: 'Test Client',
          client_phone: '11999998888',
          date: '2026-07-20',
          time: '10:00',
        });

      expect(res.status).toBe(201);
      expect(res.body.client_name).toBe('Test Client');
      expect(res.body.service_name).toBe(service.name);
      expect(res.body.end_time).toBeDefined();
    });

    it('rejects missing required fields', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({
          client_name: 'Test',
        });

      expect(res.status).toBe(400);
    });

    it('rejects invalid service_id', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({
          service_id: '00000000-0000-0000-0000-000000000000',
          client_name: 'Test Client',
          client_phone: '11999998888',
          date: '2026-07-20',
          time: '10:00',
        });

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/appointments/:id/status', () => {
    it('updates appointment status', async () => {
      // Create an appointment first
      const servicesRes = await request(app)
        .get('/api/services')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      const service = servicesRes.body[0];

      const createRes = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({
          service_id: service.id,
          client_name: 'Status Test',
          client_phone: '11988887777',
          date: '2026-07-21',
          time: '14:00',
        });

      const aptId = createRes.body.id;

      const res = await request(app)
        .patch(`/api/appointments/${aptId}/status`)
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ status: 'confirmed' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('confirmed');
    });

    it('rejects invalid status', async () => {
      const res = await request(app)
        .patch('/api/appointments/00000000-0000-0000-0000-000000000000/status')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ status: 'invalid_status' });

      expect(res.status).toBe(400);
    });
  });
});
