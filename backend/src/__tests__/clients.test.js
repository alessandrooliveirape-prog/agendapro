import { describe, it, expect } from 'vitest';
import './helper.js';
import request from 'supertest';
import { app } from '../app.js';
import { TEST_TOKEN } from './helper.js';

describe('Clients routes', () => {
  describe('GET /api/clients', () => {
    it('lists clients for authenticated business', async () => {
      const res = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('rejects without auth', async () => {
      const res = await request(app).get('/api/clients');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/clients', () => {
    it('creates a new client', async () => {
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({
          name: 'New Client',
          phone: '11988887777',
          email: 'newclient@test.com',
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('New Client');
      expect(res.body.phone).toBe('11988887777');
    });

    it('rejects missing name', async () => {
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ phone: '11988887777' });

      expect(res.status).toBe(400);
    });

    it('rejects missing phone', async () => {
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ name: 'Client No Phone' });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/clients/:id', () => {
    it('updates a client', async () => {
      const createRes = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ name: 'To Update', phone: '11777776666' });

      const clientId = createRes.body.id;

      const res = await request(app)
        .put(`/api/clients/${clientId}`)
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ name: 'Updated Client' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Client');
    });
  });

  describe('DELETE /api/clients/:id', () => {
    it('deletes a client', async () => {
      const createRes = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ name: 'To Delete', phone: '11666665555' });

      const clientId = createRes.body.id;

      const res = await request(app)
        .delete(`/api/clients/${clientId}`)
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).toBe(200);
    });
  });
});
