import { describe, it, expect } from 'vitest';
import { IEvaluator, EvaluationResult } from '../../src/domain/interfaces/IEvaluator.js';
import {
  IProblemRepository,
  IAttemptRepository,
  IEvaluationRepository,
} from '../../src/domain/interfaces/IRepositories.js';
import { Problem } from '../../src/domain/entities/Problem.js';
import { Submission } from '../../src/domain/entities/Submission.js';
import { StructuredTextSubmission } from '../../src/domain/entities/StructuredTextSubmission.js';
import { RubricCriterion } from '../../src/domain/types/common.types.js';

describe('Domain Interface Contracts Verification', () => {
  // Mock implementation confirming IEvaluator contract
  class TestEvaluator implements IEvaluator {
    public readonly evaluatorType = 'TEST_MOCK';

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async evaluate(problem: Problem, submission: Submission): Promise<EvaluationResult> {
      return {
        overallScore: 85,
        passed: true,
        summary: 'Mock evaluation passed successfully.',
        strengths: ['Clear class responsibilities'],
        weaknesses: ['Add more test edge cases'],
        evaluatorType: this.evaluatorType,
        modelName: 'mock-v1',
        criteriaScores: [
          {
            criterion: RubricCriterion.REQUIREMENT_UNDERSTANDING,
            score: 4,
            maxScore: 5,
            evidence: 'Good scope analysis',
            concern: 'None',
            suggestion: 'Keep it up',
            confidence: 'HIGH',
          },
        ],
      };
    }
  }

  it('should compile and execute an implementation of IEvaluator', async () => {
    const evaluator: IEvaluator = new TestEvaluator();
    expect(evaluator.evaluatorType).toBe('TEST_MOCK');

    const problem = new Problem({
      id: 'p-1',
      slug: 'parking-lot',
      title: 'Parking Lot',
      difficulty: 'MEDIUM',
      summary: 'Design parking lot',
      functionalRequirements: ['Park'],
      nonFunctionalRequirements: [],
      constraints: [],
      requiredEntities: [],
      suggestedPatterns: [],
    });

    const sub = StructuredTextSubmission.createEmpty('s-1');
    const result = await evaluator.evaluate(problem, sub);

    expect(result.overallScore).toBe(85);
    expect(result.passed).toBe(true);
    expect(result.criteriaScores.length).toBe(1);
    expect(result.criteriaScores[0].criterion).toBe(RubricCriterion.REQUIREMENT_UNDERSTANDING);
  });

  it('should confirm repository interfaces compile with mock implementations', () => {
    // Type-level verification that repository interfaces can be implemented cleanly
    const mockProblemRepo: Partial<IProblemRepository> = {
      findById: async () => null,
      findAll: async () => [],
    };
    const mockAttemptRepo: Partial<IAttemptRepository> = {
      findById: async () => null,
      countByProblemAndLearner: async () => 0,
    };
    const mockEvalRepo: Partial<IEvaluationRepository> = {
      findById: async () => null,
    };

    expect(mockProblemRepo.findById).toBeDefined();
    expect(mockAttemptRepo.findById).toBeDefined();
    expect(mockEvalRepo.findById).toBeDefined();
  });
});
