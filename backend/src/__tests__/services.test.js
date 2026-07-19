import { describe, it, expect } from 'vitest';
import './helper.js';
import request from 'supertest';
import { app } from '../app.js';
import { TEST_TOKEN } from './helper.js';

describe('Services routes', () => {
  describe('GET /api/services', () => {
    it('lists services for authenticated business', async () => {
      const res = await request(app)
        .get('/api/services')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).toHaveProperty('price');
      expect(res.body[0]).toHaveProperty('duration_minutes');
    });

    it('rejects without auth', async () => {
      const res = await request(app).get('/api/services');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/services', () => {
    it('creates a new service', async () => {
      const res = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({
          name: 'Test Service',
          duration_minutes: 30,
          price: 50,
          color: '#6366f1',
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Test Service');
      expect(res.body.price).toBe(50);
    });

    it('rejects invalid data (short name)', async () => {
      const res = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({
          name: 'A',
          duration_minutes: 30,
          price: 50,
        });

      expect(res.status).toBe(400);
    });

    it('rejects invalid duration', async () => {
      const res = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({
          name: 'Test Service',
          duration_minutes: 2,
          price: 50,
        });

      expect(res.status).toBe(400);
    });

    it('rejects invalid color format', async () => {
      const res = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({
          name: 'Test Service',
          duration_minutes: 30,
          price: 50,
          color: 'not-a-color',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/services/:id', () => {
    it('updates a service', async () => {
      // First create a service
      const createRes = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({
          name: 'To Update',
          duration_minutes: 30,
          price: 40,
        });

      const serviceId = createRes.body.id;

      const res = await request(app)
        .put(`/api/services/${serviceId}`)
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ price: 60 });

      expect(res.status).toBe(200);
      expect(res.body.price).toBe(60);
    });
  });

  describe('DELETE /api/services/:id', () => {
    it('soft-deletes a service', async () => {
      const createRes = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({
          name: 'To Delete',
          duration_minutes: 15,
          price: 20,
        });

      const serviceId = createRes.body.id;

      const res = await request(app)
        .delete(`/api/services/${serviceId}`)
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).toBe(200);
    });
  });
});
