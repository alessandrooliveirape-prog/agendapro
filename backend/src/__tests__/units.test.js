import { describe, it, expect } from 'vitest';
import './helper.js';
import request from 'supertest';
import { app } from '../app.js';
import { TEST_TOKEN } from './helper.js';

describe('Units routes', () => {
  describe('GET /api/units', () => {
    it('lists units for authenticated business', async () => {
      const res = await request(app)
        .get('/api/units')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('rejects without auth', async () => {
      const res = await request(app).get('/api/units');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/units', () => {
    it('creates a new unit', async () => {
      const res = await request(app)
        .post('/api/units')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({
          name: 'Filial Centro',
          phone: '1133334444',
          address: 'Rua Augusta, 1000 - São Paulo',
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Filial Centro');
      expect(res.body.address).toBe('Rua Augusta, 1000 - São Paulo');
    });

    it('rejects missing name', async () => {
      const res = await request(app)
        .post('/api/units')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ phone: '1133334444' });

      expect(res.status).toBe(400);
    });

    it('rejects short name', async () => {
      const res = await request(app)
        .post('/api/units')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ name: 'A' });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/units/:id', () => {
    it('updates a unit', async () => {
      const createRes = await request(app)
        .post('/api/units')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ name: 'To Update Unit' });

      const unitId = createRes.body.id;

      const res = await request(app)
        .put(`/api/units/${unitId}`)
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ name: 'Updated Unit' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Unit');
    });
  });

  describe('DELETE /api/units/:id', () => {
    it('deletes a unit without appointments', async () => {
      const createRes = await request(app)
        .post('/api/units')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ name: 'To Delete Unit' });

      const unitId = createRes.body.id;

      const res = await request(app)
        .delete(`/api/units/${unitId}`)
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/units/:id/stats', () => {
    it('returns stats for a unit', async () => {
      const createRes = await request(app)
        .post('/api/units')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ name: 'Stats Unit' });

      const unitId = createRes.body.id;

      const res = await request(app)
        .get(`/api/units/${unitId}/stats`)
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('monthAppointments');
      expect(res.body).toHaveProperty('monthRevenue');
      expect(res.body).toHaveProperty('activeProfessionals');
    });
  });
});
