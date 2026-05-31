process.env.JWT_SECRET = 'test-secret';

import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../../src/index.js';
import { memoryStore } from '../../src/db/memoryStore.js';

describe('auth routes', () => {
  beforeEach(() => {
    memoryStore.reset();
  });

  it('registers a user', async () => {
    const response = await request(app).post('/api/auth/register').send({
      email: 'traveler@example.com',
      password: 'TestPass123!',
      name: 'Traveler',
    });

    expect(response.status).toBe(201);
    expect(response.body.data.token).toBeTypeOf('string');
    expect(response.body.data.user.email).toBe('traveler@example.com');
  });

  it('logs in an existing user', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'traveler@example.com',
      password: 'TestPass123!',
      name: 'Traveler',
    });

    const response = await request(app).post('/api/auth/login').send({
      email: 'traveler@example.com',
      password: 'TestPass123!',
    });

    expect(response.status).toBe(200);
    expect(response.body.data.user.name).toBe('Traveler');
  });

  it('rejects invalid credentials', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'traveler@example.com',
      password: 'TestPass123!',
      name: 'Traveler',
    });

    const response = await request(app).post('/api/auth/login').send({
      email: 'traveler@example.com',
      password: 'WrongPass123!',
    });

    expect(response.status).toBe(401);
  });
});
