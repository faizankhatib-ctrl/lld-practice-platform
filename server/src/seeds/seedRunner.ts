import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { ProblemRepository } from '../repositories/ProblemRepository.js';
import { INITIAL_PROBLEMS } from './problemsSeed.js';

export async function runSeeds(): Promise<void> {
  console.log('🌱 Starting LLD Practice Platform Database Seeder...');

  try {
    await connectDatabase();
    const problemRepo = new ProblemRepository();

    console.log(`\n📦 Seeding ${INITIAL_PROBLEMS.length} curated LLD problems:`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    for (const problem of INITIAL_PROBLEMS) {
      await problemRepo.upsertBySlug(problem);
      console.log(`  ✅ [${problem.difficulty}] ${problem.title} (slug: '${problem.slug}')`);
      console.log(`     • Estimated Time: ${problem.estimatedTimeMinutes} mins`);
      console.log(`     • Required Entities: ${problem.requiredEntities.join(', ')}`);
      console.log(`     • Suggested Patterns: ${problem.suggestedPatterns.length} patterns`);
      console.log('──────────────────────────────────────────────────────────');
    }

    const allProblems = await problemRepo.findAll();
    console.log(`\n🎉 Seeding completed successfully! Total problems in database: ${allProblems.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    allProblems.forEach((p, idx) => {
      console.log(`  ${idx + 1}. ${p.title} (${p.difficulty} - ${p.slug})`);
    });
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
    console.log('🔌 Database connection closed cleanly.');
  }
}

// Execute directly if run as CLI script
if (process.argv[1]?.includes('seedRunner')) {
  runSeeds().then(() => {
    process.exit(process.exitCode || 0);
  });
}
