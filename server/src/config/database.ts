import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { env } from './env.js';

let mongod: MongoMemoryServer | null = null;

export interface DatabaseConnectionInfo {
  isInMemory: boolean;
  uri: string;
}

export async function connectDatabase(): Promise<DatabaseConnectionInfo> {
  const shouldUseMemory = env.USE_IN_MEMORY_DB || env.NODE_ENV === 'test';

  let uri = env.MONGODB_URI;
  let isInMemory = false;

  if (shouldUseMemory) {
    try {
      mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      isInMemory = true;
      console.log('⚡ Initialized In-Memory MongoDB Server for frictionless development/testing.');
    } catch (err) {
      console.warn('⚠️ Could not start MongoMemoryServer, attempting direct connection:', err);
    }
  }

  try {
    await mongoose.connect(uri);
    console.log(`✅ Connected to MongoDB (${isInMemory ? 'In-Memory Instance' : uri})`);
    return { isInMemory, uri };
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongod) {
      await mongod.stop();
      mongod = null;
    }
    console.log('🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
  }
}
