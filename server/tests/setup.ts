import { beforeAll, afterAll } from 'vitest';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.USE_IN_MEMORY_DB = 'true';
  await connectDatabase();
});

afterAll(async () => {
  await disconnectDatabase();
});
