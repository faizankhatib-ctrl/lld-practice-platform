import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';
import { ProblemRepository } from '../../src/repositories/ProblemRepository.js';
import { ProblemModel } from '../../src/models/ProblemModel.js';
import { Problem } from '../../src/domain/entities/Problem.js';

describe('ProblemRepository Integration Tests', () => {
  let repository: ProblemRepository;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.USE_IN_MEMORY_DB = 'true';
    await connectDatabase();
    repository = new ProblemRepository();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  beforeEach(async () => {
    await ProblemModel.deleteMany({});
  });

  const createSampleProblem = (id = 'prob-1', slug = 'parking-lot') =>
    new Problem({
      id,
      slug,
      title: 'Design a Parking Lot',
      difficulty: 'MEDIUM',
      estimatedTimeMinutes: 45,
      summary: 'Design a multi-floor parking lot system.',
      functionalRequirements: ['Park vehicle', 'Unpark vehicle'],
      nonFunctionalRequirements: ['Thread safe'],
      constraints: ['Max 4 floors'],
      requiredEntities: ['ParkingSpot', 'Vehicle', 'Ticket'],
      suggestedPatterns: ['Strategy', 'Factory'],
    });

  it('should save and find a problem by ID', async () => {
    const problem = createSampleProblem('prob-100', 'parking-lot-1');
    await repository.save(problem);

    const retrieved = await repository.findById('prob-100');
    expect(retrieved).not.toBeNull();
    expect(retrieved).toBeInstanceOf(Problem);
    expect(retrieved?.id).toBe('prob-100');
    expect(retrieved?.title).toBe('Design a Parking Lot');
    expect(retrieved?.estimatedTimeMinutes).toBe(45);
    expect(retrieved?.requiredEntities).toContain('ParkingSpot');
  });

  it('should find a problem by slug (case-insensitive)', async () => {
    const problem = createSampleProblem('prob-101', 'elevator-system');
    await repository.save(problem);

    const retrieved = await repository.findBySlug('ELEVATOR-SYSTEM');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.slug).toBe('elevator-system');
  });

  it('should return null when problem is not found', async () => {
    const retrieved = await repository.findById('non-existent-id');
    expect(retrieved).toBeNull();

    const bySlug = await repository.findBySlug('non-existent-slug');
    expect(bySlug).toBeNull();
  });

  it('should find all active problems', async () => {
    const p1 = createSampleProblem('p-1', 'prob-one');
    const p2 = createSampleProblem('p-2', 'prob-two');
    await repository.save(p1);
    await repository.save(p2);

    const all = await repository.findAll();
    expect(all.length).toBe(2);
    expect(all[0]).toBeInstanceOf(Problem);
    expect(all[1]).toBeInstanceOf(Problem);
  });

  it('should upsert problem cleanly without creating duplicates on same slug', async () => {
    const p1 = createSampleProblem('p-orig', 'unique-slug');
    await repository.upsertBySlug(p1);

    const updatedP1 = new Problem({
      id: 'p-orig',
      slug: 'unique-slug',
      title: 'Updated Parking Lot Title',
      difficulty: 'HARD',
      estimatedTimeMinutes: 60,
      summary: 'Updated summary.',
      functionalRequirements: ['Park vehicle'],
      nonFunctionalRequirements: [],
      constraints: [],
      requiredEntities: ['ParkingSpot'],
      suggestedPatterns: ['Strategy'],
    });

    await repository.upsertBySlug(updatedP1);

    const all = await repository.findAll();
    expect(all.length).toBe(1);
    expect(all[0].title).toBe('Updated Parking Lot Title');
    expect(all[0].difficulty).toBe('HARD');
    expect(all[0].estimatedTimeMinutes).toBe(60);
  });

  it('should return domain entities that do not expose raw Mongoose internal methods', async () => {
    const problem = createSampleProblem('p-test', 'clean-domain');
    await repository.save(problem);

    const retrieved = await repository.findById('p-test');
    expect(retrieved).toBeInstanceOf(Problem);
    // Verifies it is a pure Problem instance, not a Mongoose document
    expect((retrieved as any).save).toBeUndefined();
    expect((retrieved as any).$isNew).toBeUndefined();
    expect(typeof retrieved?.getRubricCriteria).toBe('function');
  });
});
