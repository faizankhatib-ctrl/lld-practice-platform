import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';
import { EvaluationRepository } from '../../src/repositories/EvaluationRepository.js';
import { EvaluationModel } from '../../src/models/EvaluationModel.js';
import { Evaluation } from '../../src/domain/entities/Evaluation.js';
import { ScoreCard } from '../../src/domain/entities/ScoreCard.js';
import { RubricCriterion, CriterionResult } from '../../src/domain/types/common.types.js';

describe('EvaluationRepository Integration Tests', () => {
  let repository: EvaluationRepository;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.USE_IN_MEMORY_DB = 'true';
    await connectDatabase();
    repository = new EvaluationRepository();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  beforeEach(async () => {
    await EvaluationModel.deleteMany({});
  });

  const createSampleEvaluation = (id = 'eval-1', attemptId = 'att-1', problemId = 'prob-parking') => {
    const criteria: CriterionResult[] = [
      {
        criterion: RubricCriterion.REQUIREMENT_UNDERSTANDING,
        score: 4,
        maxScore: 5,
        evidence: 'Identified all key functional requirements.',
        concern: 'Did not address EV spots in detail.',
        suggestion: 'Add EV charging spot specs.',
        confidence: 'HIGH',
      },
      {
        criterion: RubricCriterion.CLASS_RESPONSIBILITIES,
        score: 4,
        maxScore: 5,
        evidence: 'Good separation between ParkingSpot and Vehicle.',
        concern: 'ParkingLot class is slightly overloaded.',
        suggestion: 'Extract SpotAllocationStrategy.',
        confidence: 'HIGH',
      },
      {
        criterion: RubricCriterion.COUPLING_COHESION,
        score: 3,
        maxScore: 5,
        evidence: 'Classes interact cleanly via interfaces.',
        concern: 'Fee calculation couples directly to ticket timestamps.',
        suggestion: 'Inject PricingPolicy into Ticket.',
        confidence: 'MEDIUM',
      },
      {
        criterion: RubricCriterion.ENCAPSULATION_INTERFACES,
        score: 4,
        maxScore: 5,
        evidence: 'IParkingSpot interface created.',
        concern: 'None',
        suggestion: 'Keep private spot state.',
        confidence: 'HIGH',
      },
      {
        criterion: RubricCriterion.ABSTRACTION_PATTERNS,
        score: 5,
        maxScore: 5,
        evidence: 'Strategy pattern implemented for fee calculation.',
        concern: 'None',
        suggestion: 'Excellent design pattern choice.',
        confidence: 'HIGH',
      },
      {
        criterion: RubricCriterion.EXTENSIBILITY,
        score: 4,
        maxScore: 5,
        evidence: 'New vehicle types can inherit from Vehicle.',
        concern: 'None',
        suggestion: 'Clean OCP implementation.',
        confidence: 'HIGH',
      },
      {
        criterion: RubricCriterion.EDGE_CASES_TESTABILITY,
        score: 3,
        maxScore: 5,
        evidence: 'Full lot scenario described.',
        concern: 'Concurrency locking not specified in detail.',
        suggestion: 'Use fine-grained locks per floor.',
        confidence: 'MEDIUM',
      },
      {
        criterion: RubricCriterion.EXPLANATION_QUALITY,
        score: 5,
        maxScore: 5,
        evidence: 'Clear trade-offs explained between sync vs mutex.',
        concern: 'None',
        suggestion: 'Great communication of decisions.',
        confidence: 'HIGH',
      },
    ];

    const scoreCard = new ScoreCard(criteria);
    return new Evaluation({
      id,
      attemptId,
      problemId,
      scoreCard,
      summary: 'Strong design with good use of the Strategy pattern and clean class boundaries.',
      strengths: ['Strategy pattern for fee calculation', 'Clear entity definitions'],
      weaknesses: ['Concurrency locking needs elaboration'],
    });
  };

  it('should save and find an evaluation by ID', async () => {
    const evaluation = createSampleEvaluation('eval-100', 'att-100', 'prob-parking');
    await repository.save(evaluation);

    const retrieved = await repository.findById('eval-100');
    expect(retrieved).not.toBeNull();
    expect(retrieved).toBeInstanceOf(Evaluation);
    expect(retrieved?.id).toBe('eval-100');
    expect(retrieved?.attemptId).toBe('att-100');
    expect(retrieved?.getOverallScore()).toBe(80); // (32/40) * 100 = 80
    expect(retrieved?.isPassing()).toBe(true);
    expect(retrieved?.summary).toContain('Strong design');
    expect(retrieved?.strengths.length).toBe(2);

    const patternCriterion = retrieved?.getCriterionScore(RubricCriterion.ABSTRACTION_PATTERNS);
    expect(patternCriterion).toBeDefined();
    expect(patternCriterion?.score).toBe(5);
    expect(patternCriterion?.confidence).toBe('HIGH');
  });

  it('should find an evaluation by attemptId', async () => {
    const evaluation = createSampleEvaluation('eval-200', 'att-200', 'prob-elevator');
    await repository.save(evaluation);

    const retrieved = await repository.findByAttemptId('att-200');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe('eval-200');
    expect(retrieved?.problemId).toBe('prob-elevator');
  });

  it('should return null when evaluation does not exist', async () => {
    const retrieved = await repository.findById('non-existent-eval');
    expect(retrieved).toBeNull();

    const byAttempt = await repository.findByAttemptId('non-existent-att');
    expect(byAttempt).toBeNull();
  });
});
