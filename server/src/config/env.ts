import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from current directory or server directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server', '.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/lld_practice_platform'),
  USE_IN_MEMORY_DB: z
    .string()
    .transform((val) => val === 'true' || val === '1')
    .default('false'),
  EVALUATOR_TYPE: z.enum(['HYBRID', 'AI_GEMINI', 'RULE_BASED', 'MOCK']).default('MOCK'),
  AI_EVALUATOR_ENABLED: z
    .string()
    .transform((val) => val === 'true' || val === '1')
    .default('false'),
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().optional().default('gemini-1.5-flash'),
  AI_MODEL: z.string().optional().default('gemini-1.5-flash'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
