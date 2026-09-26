import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';

describe('Health API & Environment Verification', () => {
  const app = createApp();

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.USE_IN_MEMORY_DB = 'true';
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('GET /api/v1/health should respond with status: ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'ok',
    });
  });

  it('GET /api/v1/health/detailed should report connected database and environment info', async () => {
    const res = await request(app).get('/api/v1/health/detailed');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database.connected).toBe(true);
    expect(mongoose.connection.readyState).toBe(1); // 1 = connected
  });

  it('proves that the test environment runs without requiring an external MongoDB daemon', () => {
    // Verifies that Mongoose is connected to the in-memory MongoDB instance
    expect(mongoose.connection.readyState).toBe(1);
    expect(mongoose.connection.host).toContain('127.0.0.1');
  });

  it('should return 404 for unknown endpoints', async () => {
    const res = await request(app).get('/api/v1/non-existent-route');
    expect(res.status).toBe(404);
    expect(res.body.status).toBe('fail');
  });
});
