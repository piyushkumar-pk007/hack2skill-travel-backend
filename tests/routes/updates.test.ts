process.env.JWT_SECRET = 'test-secret';

import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../../src/index.js';
import { memoryStore } from '../../src/db/memoryStore.js';

describe('updates routes', () => {
  let authToken = '';

  beforeEach(async () => {
    memoryStore.reset();
    const response = await request(app).post('/api/auth/register').send({
      email: 'updates@example.com',
      password: 'TestPass123!',
      name: 'Update User',
    });
    authToken = response.body.data.token;
  });

  it('requires authentication', async () => {
    const response = await request(app).get('/api/updates').query({ destination: 'Kyoto' });
    expect(response.status).toBe(401);
  });

  it('returns updates and caches the destination feed', async () => {
    const first = await request(app)
      .get('/api/updates')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ destination: 'Kyoto', dates: '2026-08-10 to 2026-08-12' });

    const second = await request(app)
      .get('/api/updates')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ destination: 'Kyoto', dates: '2026-08-10 to 2026-08-12' });

    expect(first.status).toBe(200);
    expect(first.body.data.destination).toBe('Kyoto');
    expect(first.body.cached).toBe(false);
    expect(second.status).toBe(200);
    expect(second.body.cached).toBe(true);
    expect(second.body.data.updates.length).toBeGreaterThan(0);
  });
});
