process.env.JWT_SECRET = 'test-secret';

import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../../src/index.js';
import { memoryStore } from '../../src/db/memoryStore.js';

describe('chat routes', () => {
  let authToken = '';

  beforeEach(async () => {
    memoryStore.reset();
    const response = await request(app).post('/api/auth/register').send({
      email: 'chat@example.com',
      password: 'TestPass123!',
      name: 'Chat User',
    });
    authToken = response.body.data.token;
  });

  it('requires authentication for streaming chat', async () => {
    const response = await request(app).post('/api/chat/stream').send({
      message: 'Hello',
      history: [],
    });

    expect(response.status).toBe(401);
  });

  it('streams concierge responses over SSE', async () => {
    const response = await request(app)
      .post('/api/chat/stream')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        message: 'What should I optimize first?',
        history: [],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/event-stream');
    expect(response.text).toContain('data:');
    expect(response.text).toContain('[DONE]');
  });
});
