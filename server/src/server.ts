import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

async function bootstrap() {
  try {
    // Connect to database (either external MongoDB or in-memory server)
    await connectDatabase();

    // Auto-seed problems if empty
    const { ProblemRepository } = await import('./repositories/ProblemRepository.js');
    const { INITIAL_PROBLEMS } = await import('./seeds/problemsSeed.js');
    const problemRepo = new ProblemRepository();
    const existingCount = (await problemRepo.findAll()).length;
    if (existingCount === 0) {
      for (const prob of INITIAL_PROBLEMS) {
        await problemRepo.upsertBySlug(prob);
      }
      console.log(`🌱 Auto-seeded ${INITIAL_PROBLEMS.length} initial LLD problems.`);
    }

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      console.log(`🚀 LLD Practice Platform Server running on port ${env.PORT}`);
      console.log(`🌐 Health check available at: http://localhost:${env.PORT}/api/v1/health`);
      console.log(`🔧 Environment: ${env.NODE_ENV}`);
      console.log(`🧠 Evaluator Mode: ${env.EVALUATOR_TYPE}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDatabase();
        console.log('👋 Process terminated successfully.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
