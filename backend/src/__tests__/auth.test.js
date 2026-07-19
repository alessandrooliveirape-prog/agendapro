import { describe, it, expect } from 'vitest';
import './helper.js';
import request from 'supertest';
import { app } from '../app.js';
import { TEST_TOKEN } from './helper.js';

describe('Auth routes', () => {
  describe('POST /api/auth/login', () => {
    it('returns token with valid credentials (mock mode)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ze@barbearia.com', password: '123456' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('ze@barbearia.com');
    });

    it('rejects wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ze@barbearia.com', password: 'wrong' });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/incorretos/i);
    });

    it('rejects non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'noone@example.com', password: '123456' });

      expect(res.status).toBe(401);
    });

    it('rejects invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: '123456' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/register', () => {
    it('creates a new business and user', async () => {
      const slug = `test-${Date.now()}`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          business_name: 'Test Business',
          slug,
          name: 'Test User',
          email: `test-${Date.now()}@example.com`,
          password: '123456',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.business.slug).toBe(slug);
    });

    it('rejects duplicate slug', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          business_name: 'Test Business',
          slug: 'barbearia-do-ze', // already exists in mock
          name: 'Test User',
          email: `test-${Date.now()}@example.com`,
          password: '123456',
        });

      expect(res.status).toBe(400);
    });

    it('rejects short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          business_name: 'Test Business',
          slug: `test-${Date.now()}`,
          name: 'Test User',
          email: `test-${Date.now()}@example.com`,
          password: '123',
        });

      expect(res.status).toBe(400);
    });

    it('rejects invalid slug format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          business_name: 'Test Business',
          slug: 'INVALID SLUG!',
          name: 'Test User',
          email: `test-${Date.now()}@example.com`,
          password: '123456',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns user data with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user');
    });

    it('rejects without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('rejects invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });
  });
});
