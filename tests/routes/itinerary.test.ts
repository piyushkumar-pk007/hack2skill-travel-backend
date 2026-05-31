process.env.JWT_SECRET = 'test-secret';

import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../../src/index.js';
import { memoryStore } from '../../src/db/memoryStore.js';
import { mockTripPreferences } from '../fixtures/index.js';

describe('POST /api/itinerary/generate', () => {
  let authToken = '';

  beforeEach(async () => {
    memoryStore.reset();
    const response = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'TestPass123!',
      name: 'Test User',
    });

    authToken = response.body.data.token;
  });

  it('returns 401 without token', async () => {
    const response = await request(app).post('/api/itinerary/generate').send(mockTripPreferences);
    expect(response.status).toBe(401);
  });

  it('returns 400 for invalid preferences', async () => {
    const response = await request(app)
      .post('/api/itinerary/generate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ destination: '' });

    expect(response.status).toBe(400);
  });

  it('generates itinerary for valid request', async () => {
    const response = await request(app)
      .post('/api/itinerary/generate')
      .set('Authorization', `Bearer ${authToken}`)
      .send(mockTripPreferences);

    expect(response.status).toBe(200);
    expect(response.body.data.itinerary).toBeDefined();
    expect(response.body.data.itinerary.days).toHaveLength(3);
  });

  it('retrieves a generated itinerary by trip id', async () => {
    const createResponse = await request(app)
      .post('/api/itinerary/generate')
      .set('Authorization', `Bearer ${authToken}`)
      .send(mockTripPreferences);

    const tripId = createResponse.body.data.tripId;
    const getResponse = await request(app)
      .get(`/api/itinerary/${tripId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.tripId).toBe(tripId);
  });
});
